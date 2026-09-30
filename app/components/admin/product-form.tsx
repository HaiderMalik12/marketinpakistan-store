"use client";

import { useActionState, useState } from "react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { PhotoUploader } from "@/app/components/admin/photo-uploader";
import { optimizedImage } from "@/app/lib/images";
import type { Collection, Product } from "@/app/lib/products";

const inputClass = "w-full h-12 border border-gray-300 rounded-lg px-4 text-base bg-white";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-900">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-gray-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ProductForm({
  collections,
  product,
}: {
  collections: Collection[];
  product?: Product;
}) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct, {});
  // An error hides as soon as its field is edited, until the next submit brings new ones.
  const [dismissed, setDismissed] = useState<{ from: ProductFormState; keys: string[] }>({
    from: state,
    keys: [],
  });
  const keys = dismissed.from === state ? dismissed.keys : [];
  const dismiss = (key: string) => setDismissed({ from: state, keys: [...keys, key] });
  const errors: NonNullable<ProductFormState["errors"]> = Object.fromEntries(
    Object.entries(state.errors ?? {}).filter(([k]) => !keys.includes(k))
  );

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [quantity, setQuantity] = useState(product ? String(product.quantity) : "");
  const [catalog, setCatalog] = useState(product?.catalog ?? "");
  const [collection, setCollection] = useState(product?.collections[0] ?? collections[0]?.slug ?? "");

  const editing = Boolean(product);
  const isHidden = product?.status === "hidden";
  const shownPrice = Number(price);

  return (
    <form action={action} className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start pb-28 lg:pb-0">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-7 space-y-6">
        <PhotoUploader
          images={images}
          onChange={(next) => {
            setImages(next);
            dismiss("images");
          }}
          error={errors.images}
        />

        <Field id="name" label="Title" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              dismiss("name");
            }}
            placeholder="e.g. Rangreet Design 11"
            className={inputClass}
          />
        </Field>

        <Field id="description" label="Description" error={errors.description}>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              dismiss("description");
            }}
            placeholder="Unstitched 3-piece premium karandi suit: embroidered shirt, digital print dupata, dyed trouser"
            className="w-full h-28 border border-gray-300 rounded-lg px-4 py-3 text-base resize-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="price" label="Price (PKR)" error={errors.price}>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="numeric"
              min={0}
              value={price}
              onChange={(e) => {
              setPrice(e.target.value);
              dismiss("price");
            }}
              placeholder="3000"
              className={inputClass}
            />
          </Field>
          <Field id="quantity" label="Quantity in stock" error={errors.quantity}>
            <input
              id="quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min={0}
              value={quantity}
              onChange={(e) => {
              setQuantity(e.target.value);
              dismiss("quantity");
            }}
              placeholder="10"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field id="collection" label="Collection" error={errors.collection}>
            <select
              id="collection"
              name="collection"
              value={collection}
              onChange={(e) => {
              setCollection(e.target.value);
              dismiss("collection");
            }}
              className={inputClass}
            >
              {collections.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
          <Field id="catalog" label="Volume" error={errors.catalog} hint="Groups dresses together on the sale page.">
            <input
              id="catalog"
              name="catalog"
              type="text"
              value={catalog}
              onChange={(e) => {
              setCatalog(e.target.value);
              dismiss("catalog");
            }}
              placeholder="e.g. Volume X"
              className={inputClass}
            />
          </Field>
        </div>

        {state.message && (
          <p role="alert" className="text-sm text-rose-700">
            {state.message}
          </p>
        )}
      </div>

      <div className="lg:sticky lg:top-6 space-y-4">
        <div className="hidden lg:block bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Store preview</div>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="h-48 bg-rose-100">
              {images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={optimizedImage(images[0], 500)} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-4">
              <div className="font-semibold text-gray-800">{name || "Product title"}</div>
              <div className="text-sm text-gray-500">{catalog || "Volume"}</div>
              <div className="text-lg font-bold text-rose-600 mt-1">
                PKR {Number.isFinite(shownPrice) ? shownPrice.toLocaleString() : "0"}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-gray-200 p-3 flex gap-3 lg:static lg:bg-transparent lg:border-0 lg:p-0 lg:flex-col">
          {editing ? (
            <>
              <button
                type="submit"
                name="intent"
                value="keep"
                disabled={pending}
                className="flex-1 min-h-12 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
              {isHidden && (
                <button
                  type="submit"
                  name="intent"
                  value="publish"
                  disabled={pending}
                  className="flex-1 min-h-12 rounded-full border border-gray-300 bg-white font-semibold text-gray-800 disabled:opacity-60"
                >
                  Save and publish
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={pending}
                className="flex-1 min-h-12 rounded-full border border-gray-300 bg-white font-semibold text-gray-800 disabled:opacity-60 lg:order-2"
              >
                Save as draft
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={pending}
                className="flex-[1.4] lg:flex-1 min-h-12 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-60 lg:order-1"
              >
                {pending ? "Saving…" : "Publish to store"}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
