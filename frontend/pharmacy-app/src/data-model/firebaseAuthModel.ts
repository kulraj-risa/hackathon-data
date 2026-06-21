export type VerifiedStatus = "checking" | "verified" | "not-verified" | null;

export interface User {
  email: string | null;
  id: string;
  mfaEnabled?: boolean;
  mfaMethods?: string[];
}

export interface FirebaseAuthState {
  user: User | null;
  isLoading: boolean;
  signUpError: string | null;
  loginError: string | null;
  emailSentError: string | null;
  emailSent: boolean | null;
  passwordReset: boolean | null;
  passwordResetError: string | null;
  passwordResetInProgress: boolean | null;
  verifyingUser: VerifiedStatus;
  mfaSetupInProgress: boolean;
  mfaVerificationRequired: boolean;
  mfaError: string | null;
  mfaSetUpRequired: boolean;
}

export interface UserInput {
  email: string;
  password: string;
}
