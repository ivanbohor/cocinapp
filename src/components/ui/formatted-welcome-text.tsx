// src/components/ui/formatted-welcome-text.tsx
import { Fragment } from 'react';

interface FormattedWelcomeTextProps {
  text: string;
  className?: string;
}

/**
 * Parsea una línea individual buscando tokens **negrita** y __subrayado__
 * y los transforma en elementos nativos de React (cero dangerouslySetInnerHTML).
 */
function renderInlineTokens(line: string, lineIndex: number) {
  const tokens = line.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);

  return tokens.map((token, tokenIndex) => {
    const key = `${lineIndex}-${tokenIndex}`;

    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={key} className="font-extrabold tracking-tight">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith('__') && token.endsWith('__') && token.length > 4) {
      return (
        <span
          key={key}
          className="underline decoration-current/80 underline-offset-2"
        >
          {token.slice(2, -2)}
        </span>
      );
    }

    return <Fragment key={key}>{token}</Fragment>;
  });
}

/**
 * Renderiza el mensaje de bienvenida respetando saltos de línea, negritas y subrayados.
 */
export function FormattedWelcomeText({
  text,
  className = '',
}: FormattedWelcomeTextProps) {
  const lines = text.split(/\r?\n/);

  return (
    <span className={`block ${className}`}>
      {lines.map((line, index) => (
        <Fragment key={index}>
          {line.length === 0 ? (
            <span className="block h-2" aria-hidden="true" />
          ) : (
            <span className="block">{renderInlineTokens(line, index)}</span>
          )}
        </Fragment>
      ))}
    </span>
  );
}