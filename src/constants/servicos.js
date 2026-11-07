import {
  Hospital,
  Siren,
  Fuel,
  ShoppingCart,
  Car,
  Building2,
  Pill,
  Landmark
} from 'lucide-react';

export const TIPOS_SERVICO = [
  { id: 'saude', label: 'Saúde', Icon: Hospital },
  { id: 'seguranca', label: 'Segurança', Icon: Siren },
  { id: 'combustivel', label: 'Combustível', Icon: Fuel },
  { id: 'mercado', label: 'Mercado', Icon: ShoppingCart },
  { id: 'automotivo', label: 'Automotivo', Icon: Car },
  { id: 'publico', label: 'Público', Icon: Building2 },
  { id: 'farmacia', label: 'Farmácia', Icon: Pill },
  { id: 'banco', label: 'Banco', Icon: Landmark }
];

export function metaTipoServico(id) {
  return TIPOS_SERVICO.find((tipo) => tipo.id === id) || null;
}

export function funcionamento24hAtivo(valor) {
  return valor === true || valor === 'true';
}
