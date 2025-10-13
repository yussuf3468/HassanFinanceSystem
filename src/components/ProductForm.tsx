import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";

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
  "Erasers",
  "Markers",
  "Other",
];

export default function ProductForm({
  product,
  onClose,
  onSuccess,
}: ProductFormProps) {
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

      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-4 px-4 flex justify-center">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl shadow-xl max-w-2xl w-full h-fit my-4 max-h-[90vh] overflow-y-auto border border-white/20">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20 sticky top-0 bg-white/5 backdrop-blur-xl z-10">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {product ? "Edit Product" : "Add New Product"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-white/5 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_id}
                  onChange={(e) =>
                    setFormData({ ...formData, product_id: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="BOOK001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                >
                  {categories.map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                      className="bg-slate-900 text-white"
                    >
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Image
                </label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                    placeholder="Or paste image URL: https://example.com/image.jpg"
                  />
                  <div className="text-center text-slate-400">OR</div>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-300">
                          <span className="font-semibold">Click to upload</span>{" "}
                          product image
                        </p>
                        <p className="text-xs text-slate-400">
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
                    <p className="text-sm text-green-400">
                      Selected: {imageFile.name}
                    </p>
                  )}
                  {uploading && (
                    <p className="text-sm text-purple-400">
                      Uploading image...
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Full-width Product Description Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Product Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-slate-400"
                placeholder="e.g., Sold in packets of 10, Bulk item, Premium quality, etc."
              />
              <p className="text-xs text-slate-400">
                Add details like package size, special features, or
                clarifications for customers
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : uploading
                  ? "Uploading..."
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
