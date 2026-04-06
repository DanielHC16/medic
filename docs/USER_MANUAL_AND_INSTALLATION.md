# MEDIC User Manual and System Installation Guide

## 1. Introduction

MEDIC is a Progressive Web App (PWA) for patients, caregivers, and family members. It helps users manage medication-related information, care-circle access, routines, and patient monitoring through one shared web-based platform.

Because MEDIC is a PWA:

- It can be opened directly through a web link.
- It can be installed on a mobile phone or desktop from the browser.
- Installing it does not create a separate native mobile application. Instead, it creates a home-screen or desktop shortcut that launches the same MEDIC web system, usually in a standalone app-like view.
- Access and visible features depend on the signed-in account type.

## 2. Purpose of the System

MEDIC is designed to support three main user types:

- `Patient`
- `Caregiver`
- `Family Member`

The system allows patients to manage who can access their information, while caregivers and family members can join a patient through a secure invite flow and view the dashboard allowed for their role.

## 3. Access Methods

Users can access MEDIC in two ways:

### 3.1 Open Through a Link

The user may open the MEDIC deployment URL in a browser such as Chrome, Safari, Edge, or another supported mobile or desktop browser.

Example flow:

1. Open the MEDIC link.
2. Wait for the landing page to load.
3. Tap `Sign In` or `Sign Up`.
4. Continue based on the account type.

### 3.2 Install as a PWA

The user may install MEDIC to the device so it behaves more like an app.

When installed:

- MEDIC appears on the home screen or app list.
- Tapping the icon opens the same live web system.
- The installed experience may hide normal browser UI and look more like a mobile app.

## 4. User Roles and Access Scope

### 4.1 Patient

The patient has the highest control over their own profile and care circle.

Patient access includes:

- Patient Home
- Medication information
- Schedule view
- Care Circle management
- Wellness section
- Profile

Patient can:

- create a patient profile
- generate invite codes and invite links
- approve connection requests
- revoke access
- view who is connected

### 4.2 Caregiver

The caregiver joins a patient after signing in and using a valid invite.

Caregiver access includes:

- Caregiver Dashboard
- linked patient overview
- medication visibility and management
- wellness access
- profile

Caregiver can:

- join a patient
- switch between patients if linked to more than one
- monitor patient medication status
- view selected patient details allowed by the system

### 4.3 Family Member

The family member also joins through a valid patient invite but usually has a lighter monitoring view.

Family member access includes:

- Family Dashboard
- patient updates
- appointment visibility
- profile

Family member can:

- join a patient
- switch between patients if linked to more than one
- view updates and general patient monitoring information allowed by the system

## 5. User Manual

## 5.1 Opening the Application

1. Open the MEDIC link in a supported browser.
2. The landing page appears.
3. Choose one of the following:
   - `Sign In`
   - `Sign Up`

If a valid session already exists, the system automatically redirects the user to the correct dashboard based on role.

## 5.2 Creating an Account

### Patient Registration

1. Tap `Sign Up`.
2. Select `Patient`.
3. Enter the required details:
   - first name
   - last name
   - email
   - phone
   - password
   - date of birth
   - assistance level
4. Submit the form.
5. The system creates the account and patient profile.
6. The user is redirected to `Patient Home`.

### Caregiver or Family Member Registration

1. Tap `Sign Up`.
2. Select `Caregiver` or `Family Member`.
3. Enter the required details:
   - first name
   - last name
   - email
   - phone
   - password
4. If an invite code is already available, enter the invite code.
5. Submit the form.
6. The system creates the account.
7. If the invite is valid, the relationship is created as either:
   - `active` for auto-approved invites
   - `pending` for invites that still need patient approval
8. The user is redirected to the role dashboard.

## 5.3 Signing In

1. Tap `Sign In`.
2. Enter:
   - email or phone
   - password
3. Tap `Sign In`.
4. The system validates the account.
5. The user is redirected to the correct dashboard:
   - patient -> Patient Dashboard
   - caregiver -> Caregiver Dashboard
   - family member -> Family Dashboard

## 5.4 Patient Manual

### A. First-Time Setup

1. Open MEDIC.
2. Tap `Create Patient Profile` or `Sign Up`.
3. Enter patient details.
4. Finish registration.
5. Land on `Patient Home`.

### B. Connecting Others

1. Open `Care Circle`.
2. Choose the desired invite method:
   - Generate Invite Code
   - Send Invite Link
   - Generate QR Code payload for future QR support
3. Select the role to connect:
   - Caregiver
   - Family Member
4. Choose approval mode:
   - Manual approval
   - Auto approval
5. Share the code, link, or future QR option with the intended user.

### C. Managing Connections

The patient can view:

- connected caregivers
- connected family members
- pending requests
- invite history

The patient can perform the following actions:

- approve a connection request
- revoke access
- review who currently has access

## 5.5 Caregiver Manual

### A. Sign Up or Sign In

1. Open MEDIC.
2. Tap `Sign Up` or `Sign In`.
3. Use email, phone, and password.
4. After login, if no patient is linked yet, the dashboard shows a join flow.

### B. Join a Patient

1. Tap `Join a Patient`.
2. Choose one of the following:
   - scan QR code
   - enter invite code
   - open invite link
3. The system validates the invite.
4. A patient preview is shown.
5. Tap `Confirm Join`.
6. The relationship becomes:
   - active, if auto-approved
   - pending, if patient approval is still required

### C. After Connection

The caregiver can access:

- caregiver dashboard
- patient medication summary
- monitoring view
- medication-related actions
- patient switcher when multiple patients are linked

## 5.6 Family Member Manual

### A. Sign Up or Sign In

1. Open MEDIC.
2. Tap `Sign Up` or `Sign In`.
3. Use email, phone, and password.
4. After login, if no patient is linked yet, the dashboard shows a join flow.

### B. Join a Patient

1. Tap `Join a Patient`.
2. Choose one of the following:
   - scan QR code
   - enter invite code
   - open invite link
3. The system validates the invite.
4. A patient preview is shown.
5. Tap `Confirm Join`.
6. The relationship becomes:
   - active, if auto-approved
   - pending, if patient approval is still required

### C. After Connection

The family member can access:

- family dashboard
- patient updates
- appointment visibility
- lighter monitoring information
- patient switcher when multiple patients are linked

## 5.7 Signing Out

1. Open any authenticated screen.
2. Tap the `Logout` button.
3. The current session is cleared.
4. The user must sign in again to continue.

## 6. PWA Installation Guide

Note:

- MEDIC is designed to be used as a PWA.
- On supported browsers and deployments, users may see a browser install option automatically.
- If no automatic install prompt appears, the user can still use the browser menu option such as `Install App` or `Add to Home Screen`, where supported.

## 6.1 Android Installation

Using Chrome or another compatible browser:

1. Open the MEDIC link.
2. Wait for the site to finish loading.
3. Open the browser menu.
4. Tap `Install App` or `Add to Home screen`.
5. Confirm installation.
6. MEDIC will appear on the device home screen.
7. Tap the new icon to open MEDIC in app-like mode.

## 6.2 iPhone Installation

Using Safari:

1. Open the MEDIC link in Safari.
2. Tap the `Share` button.
3. Scroll down and tap `Add to Home Screen`.
4. Confirm the app name.
5. Tap `Add`.
6. MEDIC will appear on the home screen.
7. Tap the icon to launch the installed web app.

## 6.3 Desktop Installation

Using Chrome or Edge:

1. Open the MEDIC link.
2. Look for the install icon in the address bar or open the browser menu.
3. Choose `Install MEDIC`.
4. Confirm installation.
5. MEDIC will appear as an installed web app on the desktop or app launcher.

## 6.4 Important PWA Note

Installing MEDIC does not change the account permissions. The features visible after installation still depend on the role of the signed-in account:

- Patient sees patient tools
- Caregiver sees caregiver tools
- Family member sees family tools

## 6.5 UI Note for Installation Prompt

The installation prompt or custom modal should use a clear and visible label such as:

- `INSTALL APP`

Recommended helper text:

- `Install MEDIC on your device for faster access and an app-like experience.`

Recommended modal actions:

- `INSTALL APP`
- `NOT NOW`

This makes the PWA behavior easier for users to understand, especially on mobile devices.

## 7. System Installation Guide for Developers or Administrators

This section is for local setup, testing, or deployment preparation.

## 7.1 Minimum Requirements

- Node.js installed
- npm installed
- access to the MEDIC project files
- Neon database connection string
- session secret

## 7.2 Project Setup

1. Clone the repository:

```bash
git clone <your-repository-url>
cd medic
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` in the project root with:

```env
DATABASE_URL=your_neon_connection_string
SESSION_SECRET=replace_this_with_a_secure_random_secret
POSTGRES_URL=your_neon_connection_string
ENABLE_TEST_WORKBENCH=true
```

Notes:

- `DATABASE_URL` is the main connection string.
- `POSTGRES_URL` may be used as a fallback.
- `SESSION_SECRET` secures session cookies.
- `ENABLE_TEST_WORKBENCH=true` is optional and mainly for testing.

## 7.3 Run the Application

Start the development server:

```bash
npm run dev
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/test`

## 7.4 Bootstrap the Database

After opening the project locally:

1. Open `/test`.
2. Run the bootstrap action.
3. Confirm the schema and sample data are available.

This creates the working schema used by the project, including:

- roles
- users
- patient profiles
- invitations
- care relationships
- medications
- schedules
- logs
- activities
- appointments
- sync events

## 7.5 Demo Accounts

After bootstrap, the following sample accounts are available:

- `patient.demo@medic.local`
- `caregiver.demo@medic.local`
- `family.demo@medic.local`

Default password:

- `DemoPass123!`

## 8. Current System Notes

- MEDIC already includes core PWA metadata through the web manifest.
- Invite codes and invite links are working in the current build.
- QR code generation and scanning are planned but not yet fully implemented in the current UI.
- The final PWA install flow and hardening are still part of the broader implementation roadmap.
- Offline behavior currently exists as a limited sync/testing layer and is not yet the final full offline system.
- Some planned sections such as Health Info, Alerts, Settings, Monitoring, and Updates are part of the product structure but are still in progress in the current codebase.

## 9. Conclusion

MEDIC can be used both as a browser-based web application and as an installable PWA. Patients, caregivers, and family members use the same system but receive different views and permissions according to account type. This makes the platform flexible, accessible through a simple link, and convenient to install on mobile or desktop devices for easier day-to-day use.
