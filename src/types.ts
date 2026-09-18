export const SIZE_OPTIONS = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

export type SizeOption = (typeof SIZE_OPTIONS)[number];

export interface Product {
  id: string;
  code: string;
  color: string;
  quantity: number;
  size: SizeOption;
}

export interface OrderDraft {
  products: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormState {
  code: string;
  color: string;
  quantity: number;
  size: SizeOption | '';
}

export type ProductErrors = Partial<Record<'code' | 'color' | 'quantity' | 'size', string>>;
