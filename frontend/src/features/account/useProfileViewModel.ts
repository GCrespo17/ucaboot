import { useState, type FormEvent } from "react";
import { AUTH_ERROR_MESSAGES, type AuthErrorCode } from "../../model/auth/authErrors";
import { updateProfile } from "../../model/auth/authService";
import { profileChanges, profileOf, profileSchema, type Profile } from "../../model/auth/profile";
import { useSession } from "../../model/auth/session";
import { fieldErrors, type FieldErrors } from "../../model/forms";

type Field = "displayName" | "email" | "password";
type Notice = { tone: "info" | "error"; text: string };

// Errores que se muestran en un campo; el resto va como aviso del formulario
const FIELD_ERRORS: Partial<Record<AuthErrorCode, [Field, string]>> = {
  credenciales: ["password", "La contraseña no es correcta. El correo no se cambió."], // FA3
  correoRegistrado: ["email", "Ese correo ya pertenece a otra cuenta."], // FA2
  correoInvalido: ["email", "Escribe un correo válido."],
};

// FA6: el perfil guardado sigue igual y se puede reintentar
const SAVE_FAILED = "No se pudo guardar el perfil. Tus datos siguen como estaban; vuelve a intentar.";

// HU-1.5 editar el nombre visible y el correo
export function useProfileViewModel() {
  const session = useSession();
  const user = session.status === "activa" ? session.session.user : null;
  const saved: Profile = user ? profileOf(user) : { displayName: "", email: "" };

  const [values, setValues] = useState<Record<Field, string>>({ ...saved, password: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const emailChanged = values.email.trim().toLowerCase() !== saved.email;

  function setField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setNotice(null);

    const parsed = profileSchema(saved.email).safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error)); // FA1, FA2 y FA3 antes de llamar a Supabase
      return;
    }
    setErrors({});

    const next = { displayName: parsed.data.displayName, email: parsed.data.email };
    const changes = profileChanges(saved, next);
    if (!changes) {
      // FA4: nada que escribir
      setValues({ ...next, password: "" });
      setNotice({ tone: "info", text: "No hay cambios: tu perfil sigue igual." });
      return;
    }

    setSaving(true);
    const result = await updateProfile(saved.email, changes, parsed.data.password);
    setSaving(false);
    setValues((current) => ({ ...current, password: "" }));

    if (!result.ok) {
      const fieldError = FIELD_ERRORS[result.error];
      if (fieldError) setErrors({ [fieldError[0]]: fieldError[1] });
      else if (result.error === "red" || result.error === "desconocido") setNotice({ tone: "error", text: SAVE_FAILED });
      else setNotice({ tone: "error", text: AUTH_ERROR_MESSAGES[result.error] }); // FA5 y límite
      return;
    }

    // Con el cambio pendiente de confirmar, el correo vigente sigue siendo el anterior
    setValues({ ...next, email: result.emailPending ? saved.email : next.email, password: "" });
    setNotice({
      tone: "info",
      text: result.emailPending
        ? `Para terminar el cambio, abre el enlace que te enviamos a ${next.email} (revisa también ${saved.email}). Hasta entonces sigues entrando con ${saved.email}.`
        : "Perfil guardado.",
    });
  }

  return {
    values,
    errors,
    notice,
    saving,
    emailChanged,
    setField,
    submit,
  };
}
