export const FEATURES = {
    patientPortal: import.meta.env.VITE_FEATURE_PATIENT_PORTAL === "true" || false,
} as const;
