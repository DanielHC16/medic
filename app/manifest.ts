import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f6f7f2",
    description:
      "MEDIC is a medication and wellness companion for patients, caregivers, and family members.",
    display: "standalone",
    icons: [
      {
        src: "/medic-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    name: "MEDIC",
    short_name: "MEDIC",
    start_url: "/",
    theme_color: "#4a7c59",
  };
}
