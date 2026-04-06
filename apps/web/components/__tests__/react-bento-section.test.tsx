import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { ReactBentoSection } from '@/components/landing/react-bento-section';

const esMessages = {
  landing: {
    reactSection: {
      eyebrow: 'Muy pronto',
      sectionTitle: 'Practica de React',
      sectionSubline:
        'Crea componentes reales, explora patrones y domina React, con un IDE de Sandpack en vivo dentro de cada reto.',
      comingSoon: 'Muy pronto',
      heroTitle: 'Practica de React',
      heroSubtitle:
        'Crea componentes reales con un IDE de Sandpack en vivo. Sin configuracion, sin boilerplate: solo React y tu.',
      heroTagIde: 'IDE de Sandpack',
      heroTagVersion: 'React 19',
      heroTagPreview: 'Vista previa en vivo',
      flowLabel: 'El ciclo de practica',
      flowStep1: 'Leer',
      flowStep2: 'Construir',
      flowStep3: 'Revisar',
      patternsLabel: 'Patrones',
      patternsTitle: 'Mas de 30 patrones de React',
      patternsSubtitle:
        'De javascript-react-patterns de Lydia Hallie, convertidos en retos interactivos.',
      patternsMore: '+20 mas',
    },
  },
};

describe('ReactBentoSection', () => {
  it('renders translated landing copy instead of English placeholders', () => {
    render(
      <NextIntlClientProvider locale="es" messages={esMessages}>
        <ReactBentoSection />
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByText('Muy pronto')).not.toHaveLength(0);
    expect(screen.getByText('Vista previa en vivo')).toBeInTheDocument();
    expect(screen.getByText('El ciclo de practica')).toBeInTheDocument();
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
    expect(screen.queryByText('Live Preview')).not.toBeInTheDocument();
  });
});
