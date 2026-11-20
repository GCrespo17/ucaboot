import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { TextField } from "../../ui/TextField";
import styles from "./Account.module.css";
import { useChangePasswordViewModel } from "./useChangePasswordViewModel";
import { useProfileViewModel } from "./useProfileViewModel";

// Datos de la cuenta del anfitrión: perfil (HU-1.5) y contraseña (HU-1.6)
export function AccountView() {
  const profile = useProfileViewModel();
  const password = useChangePasswordViewModel();

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

      <section className={styles.card} aria-labelledby="contrasena-titulo">
        <div>
          <h2 id="contrasena-titulo" className={styles.cardTitle}>
            Contraseña
          </h2>
          <p className={styles.muted}>Al cambiarla se cierran tus sesiones en otros dispositivos; esta sigue abierta.</p>
        </div>

        <form className={styles.form} onSubmit={password.submit} noValidate>
          {password.notice && <FormMessage tone={password.notice.tone}>{password.notice.text}</FormMessage>}
          {password.othersOpen && (
            <Button variant="secondary" className={styles.submit} onClick={password.retryCloseOthers} disabled={password.saving}>
              Cerrar las otras sesiones
            </Button>
          )}
          <TextField
            label="Contraseña actual"
            type="password"
            name="current"
            autoComplete="current-password"
            value={password.values.current}
            onChange={(event) => password.setField("current", event.target.value)}
            error={password.errors.current}
          />
          <TextField
            label="Contraseña nueva"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            value={password.values.password}
            onChange={(event) => password.setField("password", event.target.value)}
            error={password.errors.password}
            hint={password.passwordPolicy}
          />
          <TextField
            label="Repite la contraseña nueva"
            type="password"
            name="confirm"
            autoComplete="new-password"
            value={password.values.confirm}
            onChange={(event) => password.setField("confirm", event.target.value)}
            error={password.errors.confirm}
          />
          <Button type="submit" className={styles.submit} disabled={password.saving}>
            {password.saving ? "Cambiando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </section>
    </section>
  );
}
