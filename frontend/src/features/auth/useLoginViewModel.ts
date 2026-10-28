import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { AUTH_ERROR_MESSAGES } from "../../model/auth/authErrors";
import { signIn } from "../../model/auth/authService";
import { fieldErrors, loginSchema, type FieldErrors } from "../../model/auth/credentials";
import { isAuthConfigured } from "../../model/auth/supabase";

type Field = "email" | "password";

// HU-1.2. Al abrirse la sesión, RedirectIfHost lleva al panel o a la pantalla que se pidió antes del login.
export function useLoginViewModel() {
  const location = useLocation();
  const [values, setValues] = useState<Record<Field, string>>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    // FA2 y FA3: sin datos válidos no se consulta a Supabase
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await signIn(parsed.data);
    setSubmitting(false);

    if (!result.ok) {
      // FA1 y FA5: un único mensaje y la contraseña se vacía
      setFormError(AUTH_ERROR_MESSAGES[result.error]);
      setValues((current) => ({ ...current, password: "" }));
    }
  }

  return {
    values,
    errors,
    formError,
    submitting,
    notice: isAuthConfigured ? null : AUTH_ERROR_MESSAGES.noConfigurado,
    canSubmit: isAuthConfigured && !submitting,
    // Se pasa al enlace de registro para no perder la pantalla a la que se quería llegar
    linkState: location.state as unknown,
    setField,
    submit,
  };
}
