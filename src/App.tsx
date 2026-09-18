import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Undo2,
  X
} from 'lucide-react';
import { COLOR_SUGGESTIONS, SIZE_OPTIONS } from './constants';
import { exportOrderToExcel } from './utils/exportExcel';
import type { OrderDraft, Product, ProductErrors, ProductFormState, SizeOption } from './types';

const STORAGE_KEY = 'encanto-kids-order';
const EMPTY_FORM: ProductFormState = {
  code: '',
  color: '',
  quantity: 1,
  size: ''
};

function createBlankForm(): ProductFormState {
  return { ...EMPTY_FORM };
}

function getTotalPieces(products: Product[]) {
  return products.reduce((sum, product) => sum + product.quantity, 0);
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(createBlankForm());
  const [errors, setErrors] = useState<ProductErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('Novo pedido');
  const [isReviewing, setIsReviewing] = useState(false);
  const [toast, setToast] = useState<{ message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Product | null>(null);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [orderMeta, setOrderMeta] = useState({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const [isHydrated, setIsHydrated] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OrderDraft;
        const savedProducts = Array.isArray(parsed.products) ? parsed.products : [];
        if (savedProducts.length > 0) {
          setProducts(savedProducts);
          setOrderMeta({
            createdAt: parsed.createdAt || new Date().toISOString(),
            updatedAt: parsed.updatedAt || new Date().toISOString()
          });
          setStatus('Encontramos um pedido em andamento.');
          setDraftPromptOpen(true);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (products.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          products,
          createdAt: orderMeta.createdAt,
          updatedAt: new Date().toISOString()
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isHydrated, orderMeta.createdAt, products]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    codeInputRef.current?.focus();
  }, [products.length, editingId]);

  const totalPieces = useMemo(() => getTotalPieces(products), [products]);

  const clearForm = () => {
    setForm(createBlankForm());
    setErrors({});
    setEditingId(null);
    codeInputRef.current?.focus();
  };

  const handleContinueDraft = () => {
    setDraftPromptOpen(false);
    setStatus('Pedido em andamento');
    setToast({ message: 'Pedido restaurado com sucesso.' });
  };

  const handleRestartOrder = () => {
    setProducts([]);
    setEditingId(null);
    setForm(createBlankForm());
    setIsReviewing(false);
    setDraftPromptOpen(false);
    setOrderMeta({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setStatus('Novo pedido');
    localStorage.removeItem(STORAGE_KEY);
    setToast({ message: 'Pedido reiniciado.' });
    codeInputRef.current?.focus();
  };

  const handleFieldChange = (field: keyof ProductFormState, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateForm = (): ProductErrors => {
    const nextErrors: ProductErrors = {};

    if (!form.code.trim()) {
      nextErrors.code = 'Digite o código do produto.';
    }

    if (!form.color.trim()) {
      nextErrors.color = 'Digite a cor do produto.';
    }

    if (!Number.isFinite(form.quantity) || form.quantity < 1) {
      nextErrors.quantity = 'Informe uma quantidade maior que zero.';
    }

    if (!form.size) {
      nextErrors.size = 'Escolha um tamanho.';
    }

    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const productToSave: Product = {
      id: editingId ?? crypto.randomUUID(),
      code: form.code.trim(),
      color: form.color.trim(),
      quantity: Number(form.quantity),
      size: form.size as SizeOption
    };

    setProducts((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? productToSave : item));
      }
      return [...current, productToSave];
    });

    setStatus(editingId ? 'Produto atualizado' : 'Produto adicionado');
    setToast({ message: editingId ? 'Produto atualizado.' : 'Produto adicionado.' });
    clearForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id);
    setForm({
      code: product.code,
      color: product.color,
      quantity: product.quantity,
      size: product.size
    });
    setErrors({});
    setStatus('Editando produto');
    codeInputRef.current?.focus();
  };

  const handleDeleteProduct = (product: Product) => {
    const canRemove = window.confirm(`Deseja remover o produto ${product.code} do pedido?`);
    if (!canRemove) {
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    setLastDeleted(product);
    setStatus('Produto removido');
    setToast({
      message: 'Produto removido.',
      actionLabel: 'Desfazer',
      onAction: () => {
        setProducts((current) => [product, ...current]);
        setToast(null);
        setLastDeleted(null);
      }
    });
  };

  const handleClearOrder = () => {
    if (products.length === 0) {
      return;
    }

    const shouldClear = window.confirm('Deseja limpar todo o pedido atual?');
    if (!shouldClear) {
      return;
    }

    setProducts([]);
    setEditingId(null);
    setForm(createBlankForm());
    setStatus('Pedido limpo');
    setToast({ message: 'Pedido limpo.' });
    setOrderMeta({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  };

  const handleFinalizeReview = () => {
    if (products.length === 0) {
      setStatus('Seu pedido está vazio.');
      return;
    }

    setIsReviewing(true);
    setStatus('Revisando pedido');
  };

  const handleGenerateSpreadsheet = () => {
    if (products.length === 0) {
      return;
    }

    const filename = exportOrderToExcel({ products, createdAt: orderMeta.createdAt, updatedAt: new Date().toISOString() });
    setStatus('Pedido gerado com sucesso!');
    setIsReviewing(false);
    setToast({ message: `Planilha gerada: ${filename}` });
  };

  const handleNextField = (currentField: keyof ProductFormState) => {
    if (currentField === 'code') {
      colorInputRef.current?.focus();
      return;
    }

    if (currentField === 'color') {
      const quantityInput = document.querySelector<HTMLInputElement>('input[name="quantity"]');
      quantityInput?.focus();
      return;
    }

    if (currentField === 'quantity') {
      const firstSizeButton = document.querySelector<HTMLButtonElement>('button[data-size="PP"]');
      firstSizeButton?.focus();
    }
  };

  return (
    <div className="app-shell">
      <div className="app-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">Encanto Kids</p>
            <h1>{isReviewing ? 'Revisar pedido' : 'Novo pedido'}</h1>
          </div>
          {products.length > 0 && !isReviewing && (
            <button className="ghost-button small-button" type="button" onClick={handleClearOrder}>
              <Trash2 size={16} />
              Limpar
            </button>
          )}
        </header>

        <div aria-live="polite" className="status-pill">
          <Sparkles size={14} />
          <span>{status}</span>
        </div>

        {draftPromptOpen && (
          <div className="prompt-card">
            <p>Encontramos um pedido em andamento.</p>
            <div className="prompt-actions">
              <button type="button" className="primary-button" onClick={handleContinueDraft}>
                Continuar pedido
              </button>
              <button type="button" className="secondary-button" onClick={handleRestartOrder}>
                Começar novo pedido
              </button>
            </div>
          </div>
        )}

        {!isReviewing ? (
          <main className="main-layout">
            <section className="panel form-panel">
              <form onSubmit={handleSubmit} className="product-form">
                <div className="field-group">
                  <label htmlFor="product-code">Código do produto</label>
                  <input
                    id="product-code"
                    ref={codeInputRef}
                    name="code"
                    value={form.code}
                    onChange={(event) => handleFieldChange('code', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleNextField('code');
                      }
                    }}
                    placeholder="Digite o código"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.code)}
                  />
                  {errors.code && <span className="error-text">{errors.code}</span>}
                </div>

                <div className="field-group">
                  <label htmlFor="product-color">Cor</label>
                  <input
                    id="product-color"
                    ref={colorInputRef}
                    name="color"
                    value={form.color}
                    onChange={(event) => handleFieldChange('color', event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleNextField('color');
                      }
                    }}
                    list="color-suggestions"
                    placeholder="Preto, azul, bege..."
                    autoComplete="off"
                    aria-invalid={Boolean(errors.color)}
                  />
                  <datalist id="color-suggestions">
                    {COLOR_SUGGESTIONS.map((color) => (
                      <option key={color} value={color} />
                    ))}
                  </datalist>
                  {errors.color && <span className="error-text">{errors.color}</span>}
                </div>

                <div className="field-group">
                  <label>Quantidade</label>
                  <div className="quantity-box">
                    <button
                      type="button"
                      className="step-button"
                      onClick={() => handleFieldChange('quantity', Math.max(1, Number(form.quantity) - 1))}
                      aria-label="Diminuir quantidade"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      max={999}
                      value={form.quantity}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value || 1);
                        handleFieldChange('quantity', Math.min(999, Math.max(1, nextValue)));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleNextField('quantity');
                        }
                      }}
                      aria-invalid={Boolean(errors.quantity)}
                    />
                    <button
                      type="button"
                      className="step-button"
                      onClick={() => handleFieldChange('quantity', Math.min(999, Number(form.quantity) + 1))}
                      aria-label="Aumentar quantidade"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {errors.quantity && <span className="error-text">{errors.quantity}</span>}
                </div>

                <div className="field-group">
                  <label>Tamanho</label>
                  <div className="size-grid">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        data-size={size}
                        className={`size-button ${form.size === size ? 'selected' : ''}`}
                        onClick={() => handleFieldChange('size', size)}
                        aria-pressed={form.size === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {errors.size && <span className="error-text">{errors.size}</span>}
                </div>

                <button type="submit" className="primary-button large-button">
                  <Plus size={18} />
                  {editingId ? 'Salvar produto' : 'Adicionar produto'}
                </button>

                {editingId && (
                  <button type="button" className="secondary-button compact-button" onClick={clearForm}>
                    <X size={16} />
                    Cancelar edição
                  </button>
                )}
              </form>
            </section>

            <aside className="panel list-panel">
              <div className="panel-header">
                <h2>Produtos no pedido</h2>
                <span className="count-badge">{products.length}</span>
              </div>

              {products.length === 0 ? (
                <div className="empty-state">
                  <p>Seu pedido está vazio.</p>
                  <small>Adicione o primeiro produto para começar.</small>
                </div>
              ) : (
                <div className="product-list">
                  {products.map((product) => (
                    <article key={product.id} className="product-card">
                      <div className="card-topline">
                        <span className="product-code">{product.code}</span>
                        <span className="product-size">{product.size}</span>
                      </div>

                      <p className="product-color">{product.color}</p>
                      <div className="card-footer">
                        <span className="product-quantity">{product.quantity} peça(s)</span>
                        <div className="card-actions">
                          <button type="button" aria-label={`Editar ${product.code}`} onClick={() => handleEditProduct(product)}>
                            <Pencil size={16} />
                            Editar
                          </button>
                          <button type="button" aria-label={`Excluir ${product.code}`} onClick={() => handleDeleteProduct(product)}>
                            <Trash2 size={16} />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="summary-box">
                <div className="summary-row">
                  <span>Produtos</span>
                  <strong>{products.length}</strong>
                </div>
                <div className="summary-row">
                  <span>Peças</span>
                  <strong>{totalPieces}</strong>
                </div>
                <button type="button" className="primary-button footer-button" onClick={handleFinalizeReview} disabled={products.length === 0}>
                  Finalizar pedido
                </button>
              </div>
            </aside>
          </main>
        ) : (
          <main className="review-panel">
            <div className="review-header">
              <button type="button" className="ghost-button" onClick={() => setIsReviewing(false)}>
                <ArrowLeft size={16} />
                Voltar
              </button>
            </div>

            <div className="review-summary">
              <p>{products.length} produtos</p>
              <h2>{totalPieces} peças</h2>
            </div>

            <div className="product-list review-list">
              {products.map((product) => (
                <article key={product.id} className="review-item">
                  <div>
                    <h3>{product.code}</h3>
                    <p>{product.color}</p>
                  </div>
                  <div className="review-meta">
                    <span>{product.quantity}x</span>
                    <strong>{product.size}</strong>
                  </div>
                </article>
              ))}
            </div>

            <button type="button" className="primary-button large-button" onClick={handleGenerateSpreadsheet}>
              <Download size={18} />
              Gerar planilha
            </button>
          </main>
        )}
      </div>

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button type="button" onClick={toast.onAction}>
              <Undo2 size={14} />
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
