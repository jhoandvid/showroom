import { navigate } from "./router";

/** Anchor that navigates in-app instead of reloading the document. */
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
