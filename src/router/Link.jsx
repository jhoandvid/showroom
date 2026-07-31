import { navigate } from "./router";

/** Enlace que navega dentro de la aplicación sin recargar el documento. */
export function Link({ to, children, className, style, ...rest }) {
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
