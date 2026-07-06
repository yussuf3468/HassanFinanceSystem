import { useEffect, useMemo, useState } from "react";
import { X, Upload, ImageIcon, Loader2, Check, Package, Tag, Banknote, Boxes, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  uploadProductImage,
  createProduct,
  updateProduct,
} from "../api/productsApi";
import type { Product } from "../types";
import { invalidateProductCaches } from "../utils/cacheInvalidation";

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const categories = [
  "Books",
  "Backpacks",
  "Bottles",
  "Electronics",
  "Toys",
  "Pens",
  "Notebooks",
  "Pencils",
  "Shapeners",
  "Markers",
  "Quran",
  "Print pepa",
  "Office fell",
  "Lunch box",
  "Bags",
  "Sabuurad",
  "Ink",
  "Water color",
  "Crayons",
  "Kutub elmi",
  "Cup hot",
  "Speaker",
  "Locks/Qufulo",
  "Malab/Honey",
  "Other",
  "Shower",
  "Set",
  "Dalad",
  "Glue",
  "Remote",
  "Cello Tape",
];

const inputClass =
  "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-lg text-[15px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500 dark:focus:border-emerald-500";

const labelClass =
  "flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

export default function ProductForm({
  product,
  onClose,
  onSuccess,
}: ProductFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    category: categories[0],
    image_url: "",
    buying_price: "",
    selling_price: "",
    quantity_in_stock: "",
    reorder_level: "5",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        product_id: product.product_id,
        name: product.name,
        category: product.category,
        image_url: product.image_url || "",
        buying_price: product.buying_price.toString(),
        selling_price: product.selling_price.toString(),
        quantity_in_stock: product.quantity_in_stock.toString(),
        reorder_level: product.reorder_level.toString(),
        description: product.description || "",
      });
    }
  }, [product]);

  // Close on Escape for accessibility.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Live preview: freshly picked file wins over a pasted URL.
  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return formData.image_url || null;
  }, [imageFile, formData.image_url]);

  useEffect(() => {
    return () => {
      if (imageFile && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [imageFile, previewUrl]);

  async function uploadImage(file: File): Promise<string | null> {
    try {
      setUploading(true);
      return await uploadProductImage(file);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const data = {
        product_id: formData.product_id,
        name: formData.name,
        category: formData.category,
        image_url: imageUrl || null,
        buying_price: parseFloat(formData.buying_price),
        selling_price: parseFloat(formData.selling_price),
        quantity_in_stock: parseInt(formData.quantity_in_stock),
        reorder_level: parseInt(formData.reorder_level),
        description: formData.description || null,
      };

      if (product) {
        await updateProduct(product.id, data);
      } else {
        await createProduct(data);
      }

      await invalidateProductCaches(queryClient);

      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      const message =
        error instanceof Error ? error.message : "Failed to save product";
      alert(
        message.includes("Plan limit")
          ? message
          : `Failed to save product: ${message}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  const margin =
    parseFloat(formData.selling_price) - parseFloat(formData.buying_price);
  const showMargin =
    !Number.isNaN(margin) &&
    formData.buying_price !== "" &&
    formData.selling_price !== "";

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {product ? "Edit Product" : "Add New Product"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {product
                  ? "Update the details of this product"
                  : "Fill in the details to add a product to your inventory"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="px-5 sm:px-6 py-5 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-hide"
          >
            {/* ── Basics ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Product ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  className={inputClass}
                  placeholder="BK-001"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Oxford English Dictionary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>
                  <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className={inputClass}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Image ── */}
            <div className="mt-5">
              <label className={labelClass}>
                <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Product Image
              </label>
              <div className="flex gap-4">
                {/* Preview */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-dashed border-emerald-400/70 dark:border-emerald-600 rounded-lg cursor-pointer text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                    <Upload className="w-4 h-4" />
                    {imageFile ? "Change image" : "Upload image"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setFormData({ ...formData, image_url: "" });
                        }
                      }}
                    />
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      if (e.target.value) setImageFile(null);
                    }}
                    className={inputClass}
                    placeholder="or paste an image URL"
                  />
                  {imageFile && (
                    <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                      {imageFile.name}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PNG, JPG or WEBP, up to 5 MB
                  </p>
                </div>
              </div>
            </div>

            {/* ── Pricing & stock ── */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Buying Price (KES) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.buying_price}
                  onChange={(e) =>
                    setFormData({ ...formData, buying_price: e.target.value })
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Selling Price (KES) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) =>
                    setFormData({ ...formData, selling_price: e.target.value })
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
                {showMargin && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      margin >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    Profit per unit: KES {margin.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Quantity in Stock <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity_in_stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity_in_stock: e.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <Boxes className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Reorder Level <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: e.target.value })
                  }
                  className={inputClass}
                  placeholder="5"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  You'll be alerted when stock falls to this level
                </p>
              </div>
            </div>

            {/* ── Description ── */}
            <div className="mt-5">
              <label className={labelClass}>
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="e.g. 320-page hardcover, KLB revision guide for Form 4"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Shown to customers on the storefront product page
              </p>
            </div>

            {/* ── Actions ── */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {(submitting || uploading) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {uploading
                  ? "Uploading image…"
                  : submitting
                    ? "Saving…"
                    : product
                      ? "Update Product"
                      : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
