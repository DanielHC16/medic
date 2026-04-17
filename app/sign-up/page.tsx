import { redirect } from 'next/navigation';

import { getCurrentUser, getDefaultRouteForRole } from '@/lib/auth/dal';
import { SignUpClient } from './sign-up-client';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void> | void;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
  }>;
};

// --- Icons used for the PWA Popup ---
function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
// ------------------------------------

export default function SignUpPage() {
  const router = useRouter();

  // 1. Wizard Step State
  const [step, setStep] = useState(1);

  // 2. Form Data State
  const [formData, setFormData] = useState({
    role: 'patient',
    firstName: '',
    lastName: '',
    birthday: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    assistance: 'independent',
    assistanceDetails: '',
    approvalMode: 'manual',
    inviteCode: '',
  });

  // 3. UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 4. PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [finalRedirectUrl, setFinalRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as DeferredPromptEvent);
      // We do NOT set showInstallPopup(true) here because we want to wait until registration completes
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const proceedToDashboard = (url: string | null) => {
    if (url) {
      router.push(url);
      router.refresh();
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    
    setShowInstallPopup(false);
    proceedToDashboard(finalRedirectUrl);
  };

  const handleDismissInstall = () => {
    setShowInstallPopup(false);
    proceedToDashboard(finalRedirectUrl);
  };

  // Helpers to update form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleAssistanceSelect = (assistance: string) => {
    setFormData((prev) => ({ ...prev, assistance }));
  };

  // 5. Navigation Handlers
  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
      return;
    }
    router.push('/');
  };

  // 6. Final Submission Logic
  const submitForm = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: formData.role,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.role === 'patient' ? formData.birthday : undefined,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          ...(formData.role === 'patient' && {
            assistanceLevel: formData.assistance,
            emergencyNotes:
              formData.assistance === 'limited_mobility'
                ? formData.assistanceDetails
                : undefined,
          }),
          ...(formData.role !== 'patient' && {
            approvalMode: formData.approvalMode,
            inviteCode: formData.inviteCode,
          }),
        }),
      });

      const data = await response.json() as {
        message?: string;
        ok: boolean;
        redirectTo?: string;
      };

      if (!response.ok || !data.ok || !data.redirectTo) {
        throw new Error(data.message || 'Failed to create account.');
      }

      return data.redirectTo;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Wizard Flow Handler
  const handleNextOrSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    // Step 1: Role Selection
    if (step === 1 && !formData.role) {
      setError("Please select a role to continue.");
      return;
    }
    // Step 2: Basic Info
    if (
      step === 2 &&
      (!formData.firstName ||
        !formData.lastName ||
        (formData.role === 'patient' && !formData.birthday))
    ) {
      setError("Please fill out all fields to continue.");
      return;
    }
    // Step 3: Contact Info
    if (step === 3 && (!formData.email || !formData.phone)) {
      setError("Please provide both email and phone number.");
      return;
    }
    // Step 4: Passwords
    if (step === 4) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      
      // Branch logic based on Role
      if (formData.role === 'patient') {
        setStep(5); // Go to patient health details
      } else {
        setStep(6); // Go to optional invite details
      }
      return;
    }

    // Submission step triggers (Step 5 or 6 depending on role)
    if (step === 5 || step === 6) {
      if (step === 5 && formData.assistance === 'limited_mobility' && !formData.assistanceDetails) {
        setError("Please specify your mobility limitations.");
        return;
      }

      const redirectTo = await submitForm();
      if (redirectTo) {
        // Successful Registration Interception:
        // If the device supports PWA and it's not installed, show the prompt.
        if (deferredPrompt) {
          setFinalRedirectUrl(redirectTo);
          setShowInstallPopup(true);
        } else {
          // If already installed or not supported (like iOS Safari), route normally.
          proceedToDashboard(redirectTo);
        }
      }
      return;
    }

  if (user) {
    redirect(getDefaultRouteForRole(user));
  }

  return <SignUpClient />;
}

// Custom Radio Component
function CustomRadio({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div 
      className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition"
      onClick={onClick}
    >
      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-[#384D4D]' : 'border-[#4A5D52]'}`}>
        {selected && <div className="w-2.5 h-2.5 bg-[#384D4D] rounded-full" />}
      </div>
      <span className="text-[15px] font-medium text-[#1F2924]">{label}</span>
    </div>
  );
}

// Reusable Eye Icon
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
