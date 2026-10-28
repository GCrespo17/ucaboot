import { Link } from "react-router-dom";
import { Button } from "../../ui/Button";
import { FormMessage } from "../../ui/FormMessage";
import { TextField } from "../../ui/TextField";
import styles from "./AuthView.module.css";
import { useLoginViewModel } from "./useLoginViewModel";

export function LoginView() {
  const vm = useLoginViewModel();

  return (
    <section className={styles.card} aria-labelledby="login-titulo">
      <h1 id="login-titulo" className={styles.title}>
        Iniciar sesión
      </h1>
      {vm.notice && <FormMessage tone="info">{vm.notice}</FormMessage>}

      <form className={styles.form} onSubmit={vm.submit} noValidate>
        {vm.formError && <FormMessage>{vm.formError}</FormMessage>}
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
          autoComplete="current-password"
          value={vm.values.password}
          onChange={(event) => vm.setField("password", event.target.value)}
          error={vm.errors.password}
        />
        <Button type="submit" className={styles.submit} disabled={!vm.canSubmit}>
          {vm.submitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className={styles.switch}>
        ¿No tienes cuenta?{" "}
        <Link to="/registro" state={vm.linkState}>
          Crea una
        </Link>
      </p>
    </section>
  );
}
