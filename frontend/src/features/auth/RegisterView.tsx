import { Link } from "react-router-dom";
import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { TextField } from "../../ui/TextField";
import styles from "./AuthView.module.css";
import { useRegisterViewModel } from "./useRegisterViewModel";

export function RegisterView() {
  const vm = useRegisterViewModel();

  return (
    <section className={styles.card} aria-labelledby="registro-titulo">
      <h1 id="registro-titulo" className={styles.title}>
        Crear cuenta
      </h1>
      {vm.notice && <FormMessage tone="info">{vm.notice}</FormMessage>}

      <form className={styles.form} onSubmit={vm.submit} noValidate>
        {vm.formError && <FormMessage>{vm.formError}</FormMessage>}
        {vm.info && <FormMessage tone="info">{vm.info}</FormMessage>}
        <TextField
          label="Correo"
          type="email"
          name="email"
          autoComplete="email"
          value={vm.values.email}
          onChange={(event) => vm.setField("email", event.target.value)}
          error={vm.errors.email}
        />
        <TextField
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          value={vm.values.password}
          onChange={(event) => vm.setField("password", event.target.value)}
          error={vm.errors.password}
          hint={vm.passwordPolicy}
        />
        <TextField
          label="Repite la contraseña"
          type="password"
          name="confirm"
          autoComplete="new-password"
          value={vm.values.confirm}
          onChange={(event) => vm.setField("confirm", event.target.value)}
          error={vm.errors.confirm}
        />
        <Button type="submit" className={styles.submit} disabled={!vm.canSubmit}>
          {vm.submitting ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className={styles.switch}>
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" state={vm.linkState}>
          Inicia sesión
        </Link>
      </p>
    </section>
  );
}
