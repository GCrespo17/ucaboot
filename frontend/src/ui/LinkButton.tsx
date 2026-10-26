import { Link, type LinkProps } from "react-router-dom";
import styles from "./Button.module.css";
import type { ButtonVariant } from "./Button";

// Enlace del router con el aspecto de un Button
export function LinkButton({ variant = "primary", className, ...props }: LinkProps & { variant?: ButtonVariant }) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");
  return <Link className={classes} {...props} />;
}
