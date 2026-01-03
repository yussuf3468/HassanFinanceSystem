import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
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

export default function ProductForm({
  product,
  onClose,
  onSuccess,
}: ProductFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    category: "Electronics",
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
    // Scroll to top for better UX when modal opens
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [product]);

  async function uploadImage(file: File): Promise<string | null> {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
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

      // Upload new image if one was selected
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
        const { error } = await supabase
          .from("products")
          .update(data)
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(data);
        if (error) throw error;
      }

      // ✅ Invalidate product caches to update inventory lists
      await invalidateProductCaches(queryClient);

      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-4 px-4 flex justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full h-fit my-4 max-h-[90vh] overflow-y-auto border-2 border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between p-5 sm:p-6 border-b-2 border-amber-100 dark:border-amber-800 sticky top-0 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-900/20 dark:via-slate-800 dark:to-amber-900/20 z-10 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {product ? "✏️ Edit Product" : "➕ Add New Product"}
            </h3>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-amber-100 dark:hover:bg-amber-800/40 rounded-xl transition-all hover:scale-110 active:scale-95 text-slate-700 dark:text-slate-300 border border-transparent hover:border-amber-200 dark:hover:border-amber-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-7 space-y-5 sm:space-y-6 bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-800 dark:via-slate-700/30 dark:to-slate-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">🆔</span>
                  Product ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                  placeholder="BOOK001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">📦</span>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">📂</span>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">🖼️</span>
                  Product Image
                </label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                    placeholder="Or paste image URL: https://example.com/image.jpg"
                  />
                  <div className="text-center text-slate-500 dark:text-slate-400 font-medium text-sm">
                    OR
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-amber-300 dark:border-amber-600 rounded-2xl cursor-pointer bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-900/10 dark:to-slate-800 hover:from-amber-100/50 hover:to-amber-50/30 dark:hover:from-amber-900/20 dark:hover:to-slate-700 transition-all hover:border-amber-400 dark:hover:border-amber-500 group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-800/40 dark:to-amber-900/20 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="mb-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                          <span className="font-semibold">Click to upload</span>{" "}
                          product image
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          PNG, JPG or WEBP (MAX. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            // Clear URL if file is selected
                            setFormData({ ...formData, image_url: "" });
                          }
                        }}
                      />
                    </label>
                  </div>
                  {imageFile && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <span className="text-green-600 dark:text-green-400">
                        ✓
                      </span>
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        Selected: {imageFile.name}
                      </p>
                    </div>
                  )}
                  {uploading && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <span className="text-amber-600 dark:text-amber-400">
                        ⏳
                      </span>
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                        Uploading image...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">💰</span>
                  Qiimaha Iibsiga - Buying Price (KES) *
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
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600 dark:text-amber-400">💵</span>
                  Qiimaha Iibka - Selling Price (KES) *
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
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600">📊</span>
                  Quantity in Stock *
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
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <span className="text-amber-600">🔔</span>
                  Reorder Level *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Full-width Product Description Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <span className="text-amber-600">📝</span>
                Product Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 resize-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm hover:border-amber-300 dark:hover:border-amber-600"
                placeholder="e.g., Sold in packets of 10, Bulk item, Premium quality, etc."
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add details like package size, special features, or
                clarifications for customers
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t-2 border-amber-100 dark:border-amber-800">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all font-semibold hover:scale-105 active:scale-95 shadow-sm"
              >
                ✖️ Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-95 hover:scale-105 font-bold border-2 border-amber-400 dark:border-amber-500"
                style={{ WebkitTapHighlightColor: "rgba(245,158,11,0.4)" }}
              >
                {submitting
                  ? "⏳ Saving..."
                  : uploading
                  ? "📤 Uploading..."
                  : product
                  ? "✓ Update Product"
                  : "➕ Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
