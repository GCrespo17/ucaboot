import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { AUTH_ERROR_MESSAGES } from "../../model/auth/authErrors";
import { signUp } from "../../model/auth/authService";
import { PASSWORD_POLICY, registerSchema } from "../../model/auth/credentials";
import { fieldErrors, type FieldErrors } from "../../model/forms";
import { isAuthConfigured } from "../../model/auth/supabase";

type Field = "email" | "password" | "confirm";

const CONFIRM_EMAIL = "Te enviamos un correo para confirmar la cuenta. Ábrelo y luego inicia sesión.";

// HU-1.1. Si Supabase abre la sesión al registrar, RedirectIfHost lleva al panel sin un segundo inicio de sesión.
export function useRegisterViewModel() {
  const location = useLocation();
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    // FA2 a FA5: se señala cada campo con problema y no se crea la cuenta
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    setInfo(null);
    setSubmitting(true);
    const result = await signUp(parsed.data);
    setSubmitting(false);

    if (result.ok) {
      if (result.needsConfirmation) setInfo(CONFIRM_EMAIL);
      return;
    }

    // FA1 y FA7: se conserva el correo y se vacían las contraseñas
    setValues((current) => ({ ...current, password: "", confirm: "" }));
    if (result.error === "contrasenaDebil") setErrors({ password: AUTH_ERROR_MESSAGES.contrasenaDebil });
    else if (result.error === "correoInvalido") setErrors({ email: AUTH_ERROR_MESSAGES.correoInvalido });
    else setFormError(AUTH_ERROR_MESSAGES[result.error]);
  }

  return {
    values,
    errors,
    formError,
    info,
    submitting,
    passwordPolicy: PASSWORD_POLICY,
    notice: isAuthConfigured ? null : AUTH_ERROR_MESSAGES.noConfigurado,
    canSubmit: isAuthConfigured && !submitting,
    linkState: location.state as unknown,
    setField,
    submit,
  };
}
