import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { TextField } from "../../ui/TextField";
import styles from "./Account.module.css";
import { useProfileViewModel } from "./useProfileViewModel";

// Datos de la cuenta del anfitrión. HU-1.5 perfil; aquí también irá el cambio de contraseña (HU-1.6).
export function AccountView() {
  const profile = useProfileViewModel();

  return (
    <section className={styles.page} aria-labelledby="cuenta-titulo">
      <h1 id="cuenta-titulo" className={styles.title}>
        Mi cuenta
      </h1>

      <section className={styles.card} aria-labelledby="perfil-titulo">
        <div>
          <h2 id="perfil-titulo" className={styles.cardTitle}>
            Perfil
          </h2>
          <p className={styles.muted}>Tu nombre solo identifica tu cuenta; no es el apodo de los participantes.</p>
        </div>

        <form className={styles.form} onSubmit={profile.submit} noValidate>
          {profile.notice && <FormMessage tone={profile.notice.tone}>{profile.notice.text}</FormMessage>}
          <TextField
            label="Nombre visible"
            name="displayName"
            autoComplete="nickname"
            maxLength={60}
            value={profile.values.displayName}
            onChange={(event) => profile.setField("displayName", event.target.value)}
            error={profile.errors.displayName}
            hint="Entre 2 y 40 caracteres."
          />
          <TextField
            label="Correo"
            type="email"
            name="email"
            autoComplete="email"
            value={profile.values.email}
            onChange={(event) => profile.setField("email", event.target.value)}
            error={profile.errors.email}
          />
          {profile.emailChanged && (
            <TextField
              label="Contraseña actual"
              type="password"
              name="password"
              autoComplete="current-password"
              value={profile.values.password}
              onChange={(event) => profile.setField("password", event.target.value)}
              error={profile.errors.password}
              hint="Para cambiar el correo confirma que eres tú."
            />
          )}
          <Button type="submit" className={styles.submit} disabled={profile.saving}>
            {profile.saving ? "Guardando…" : "Guardar"}
          </Button>
        </form>
      </section>
    </section>
  );
}
