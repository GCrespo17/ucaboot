import { useState, type FormEvent } from "react";
import { AUTH_ERROR_MESSAGES } from "../../model/auth/authErrors";
import { changePassword, closeOtherSessions } from "../../model/auth/authService";
import { PASSWORD_POLICY } from "../../model/auth/credentials";
import { changePasswordSchema } from "../../model/auth/password";
import { useSession } from "../../model/auth/session";
import { fieldErrors, type FieldErrors } from "../../model/forms";

type Field = "current" | "password" | "confirm";
type Notice = { tone: "info" | "error"; text: string };

const EMPTY: Record<Field, string> = { current: "", password: "", confirm: "" };

// FA4: la contraseña anterior sigue vigente y las otras sesiones siguen abiertas
const SAVE_FAILED = "No se pudo cambiar la contraseña. La anterior sigue vigente; vuelve a intentar.";
const OTHERS_OPEN = "Tu contraseña cambió, pero no se pudieron cerrar tus otras sesiones.";

// HU-1.6 cambiar la contraseña desde la sesión
export function useChangePasswordViewModel() {
  const session = useSession();
  const email = session.status === "activa" ? (session.session.user.email ?? "") : "";

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  // La contraseña ya cambió, pero quedan otras sesiones abiertas: se ofrece reintentar solo eso
  const [othersOpen, setOthersOpen] = useState(false);

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setNotice(null);
    setOthersOpen(false);

    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error)); // FA2 antes de llamar a Supabase
      return;
    }
    setErrors({});

    setSaving(true);
    const result = await changePassword(email, parsed.data.current, parsed.data.password);
    setSaving(false);

    if (!result.ok) {
      if (result.error === "credenciales") {
        // FA1: no cambia nada y se vacían los tres campos
        setValues(EMPTY);
        setNotice({ tone: "error", text: "La contraseña actual no es correcta. No se cambió nada." });
      } else if (result.error === "mismaContrasena" || result.error === "contrasenaDebil") {
        setErrors({ password: AUTH_ERROR_MESSAGES[result.error] }); // FA2 según Supabase
      } else if (result.error === "red" || result.error === "desconocido") {
        setNotice({ tone: "error", text: SAVE_FAILED });
      } else {
        setNotice({ tone: "error", text: AUTH_ERROR_MESSAGES[result.error] }); // FA3 y límite
      }
      return;
    }

    setValues(EMPTY);
    if (result.othersClosed) {
      setNotice({ tone: "info", text: "Contraseña cambiada. Cerramos tus otras sesiones; esta sigue abierta." });
    } else {
      setOthersOpen(true);
      setNotice({ tone: "error", text: OTHERS_OPEN });
    }
  }

  async function retryCloseOthers() {
    setSaving(true);
    const result = await closeOtherSessions();
    setSaving(false);
    if (result.ok) {
      setOthersOpen(false);
      setNotice({ tone: "info", text: "Contraseña cambiada. Cerramos tus otras sesiones; esta sigue abierta." });
    } else {
      setNotice({ tone: "error", text: OTHERS_OPEN });
    }
  }

  return {
    values,
    errors,
    notice,
    saving,
    othersOpen,
    passwordPolicy: PASSWORD_POLICY,
    setField,
    submit,
    retryCloseOthers,
  };
}
