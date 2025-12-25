import { useState, useMemo, useEffect } from "react";
import {
  Package,
  ChevronRight,
  Search,
  BookOpen,
  FolderOpen,
  Layers,
  ArrowLeft,
  ArrowUp,
  X,
  Tag,
  Barcode,
  DollarSign,
  TrendingUp,
  Edit,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import ProductForm from "./ProductForm";

export default function OrganizedInventory() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const itemsPerPage = 30;

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auto scroll to top on navigation changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategory, selectedSubcategory, selectedGroup, currentPage]);

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity,
  });

  // Organize products by category and subcategory
  const organizedData = useMemo(() => {
    const categories = new Map<string, Map<string, Product[]>>();

    products.forEach((product) => {
      let category = product.category || "Uncategorized";

      // Merge "Notebooks" category into "Books" category
      if (category.toLowerCase() === "notebooks") {
        category = "Books";
      }

      // Merge "Quran" category into "Books" category
      if (category.toLowerCase() === "quran") {
        category = "Books";
      }

      // Merge "Cup hot" category into "Cups & Mugs" category
      if (category.toLowerCase() === "cup hot") {
        category = "Cups & Mugs";
      }

      if (!categories.has(category)) {
        categories.set(category, new Map());
      }

      const subcategories = categories.get(category)!;

      // Handle non-book items first (Cups, Files, etc.)
      const nameLower = product.name.toLowerCase();

      // Check for cups/mugs (not books - create separate category)
      const isCup =
        nameLower.includes("cup") ||
        nameLower.includes("mug") ||
        nameLower.includes("coffee") ||
        nameLower.includes("tea cup") ||
        nameLower.includes("flask");

      // Check for files and display files (not books - create separate category)
      const isFile =
        (nameLower.includes("file") || nameLower.includes("display")) &&
        !nameLower.includes("profile") &&
        !nameLower.includes("filing");

      if (isCup) {
        // Move cups to separate category
        if (!categories.has("Cups & Mugs")) {
          categories.set("Cups & Mugs", new Map());
        }
        const cupSubcategories = categories.get("Cups & Mugs")!;
        if (!cupSubcategories.has("All Items")) {
          cupSubcategories.set("All Items", []);
        }
        cupSubcategories.get("All Items")!.push(product);
        return; // Skip rest of processing
      }

      if (isFile) {
        // Move files to separate category
        if (!categories.has("Files & Display Items")) {
          categories.set("Files & Display Items", new Map());
        }
        const fileSubcategories = categories.get("Files & Display Items")!;
        if (!fileSubcategories.has("All Items")) {
          fileSubcategories.set("All Items", []);
        }
        fileSubcategories.get("All Items")!.push(product);
        return; // Skip rest of processing
      }

      // For Books category, organize by grade and type
      if (category.toLowerCase() === "books") {
        let subcategory = "Story Books"; // Default for unmatched books

        // Check for Quran FIRST (highest priority)
        if (
          nameLower.includes("quran") ||
          nameLower.includes("qur'an") ||
          nameLower.includes("koran")
        ) {
          subcategory = "Quran";
        }
        // Check for story books - with explicit keywords
        else if (
          nameLower.includes("story") ||
          nameLower.includes("stories") ||
          nameLower.includes("novel") ||
          nameLower.includes("tale") ||
          nameLower.includes("tales") ||
          nameLower.includes("adventure") ||
          nameLower.includes("fiction") ||
          nameLower.includes("fairy") ||
          nameLower.includes("fable") ||
          nameLower.includes("narrative") ||
          nameLower.includes("legend")
        ) {
          subcategory = "Story Books";
        }
        // Check for Revision Books (Targeter, Signal, Highflyer, Encyclopedia, etc.) - BEFORE Pre-Primary to catch "highflayer pp1/pp2"
        else if (
          nameLower.includes("targeter") ||
          nameLower.includes("target") ||
          nameLower.includes("signal") ||
          nameLower.includes("highflyer") ||
          nameLower.includes("highflayer") ||
          nameLower.includes("high fly") ||
          nameLower.includes("high flyer") ||
          nameLower.includes("encyclopedia") ||
          nameLower.includes("encyclopaedia") ||
          nameLower.includes("revision") ||
          nameLower.includes("topical") ||
          nameLower.includes("premier") ||
          nameLower.includes("combined") ||
          nameLower.includes("smartbost") ||
          nameLower.includes("smartways")
        ) {
          // Subcategorize revision books
          if (nameLower.includes("targeter") || nameLower.includes("target")) {
            subcategory = "Revision Books - Targeter";
          } else if (nameLower.includes("signal")) {
            subcategory = "Revision Books - Signal";
          } else if (
            nameLower.includes("highflyer") ||
            nameLower.includes("highflayer") ||
            nameLower.includes("high fly") ||
            nameLower.includes("high flyer")
          ) {
            subcategory = "Revision Books - Highflyer";
          } else if (
            nameLower.includes("encyclopedia") ||
            nameLower.includes("encyclopaedia")
          ) {
            subcategory = "Revision Books - Encyclopedia";
          } else if (nameLower.includes("premier")) {
            subcategory = "Revision Books - Premier";
          } else {
            subcategory = "Revision Books - Other";
          }
        }
        // Check for Pre-Primary (PP1, PP2, Nursery, Pre-Primary)
        else if (
          nameLower.includes("pp1") ||
          nameLower.includes("pp 1") ||
          nameLower.includes("pre-primary 1") ||
          nameLower.includes("preprimary 1")
        ) {
          subcategory = "Pre-Primary - PP1";
        } else if (
          nameLower.includes("pp2") ||
          nameLower.includes("pp 2") ||
          nameLower.includes("pre-primary 2") ||
          nameLower.includes("preprimary 2")
        ) {
          subcategory = "Pre-Primary - PP2";
        } else if (
          nameLower.includes("pre-primary") ||
          nameLower.includes("preprimary") ||
          nameLower.includes("nursery") ||
          nameLower.includes("baby class") ||
          nameLower.includes("babyclass")
        ) {
          subcategory = "Pre-Primary - General";
        }
        // Check for Dictionaries (Oxford, Kamusi, Longhorn, EAEP)
        else if (
          nameLower.includes("dictionary") ||
          nameLower.includes("kamusi")
        ) {
          if (nameLower.includes("oxford")) {
            subcategory = "Dictionaries - Oxford";
          } else if (nameLower.includes("kamusi")) {
            subcategory = "Dictionaries - Kamusi";
          } else if (nameLower.includes("longhorn")) {
            subcategory = "Dictionaries - Longhorn";
          } else if (nameLower.includes("eaep")) {
            subcategory = "Dictionaries - EAEP";
          } else {
            subcategory = "Dictionaries - Other";
          }
        }
        // Check for Workbooks and Activity Books
        else if (
          nameLower.includes("workbook") ||
          nameLower.includes("work book") ||
          nameLower.includes("activity book") ||
          (nameLower.includes("exercise book") &&
            (nameLower.includes("grade") ||
              nameLower.includes("std") ||
              nameLower.includes("class")))
        ) {
          // Try to get grade from workbook (check from highest to lowest to avoid 10 matching as 1)
          for (let grade = 10; grade >= 1; grade--) {
            if (
              nameLower.includes(`grade ${grade}`) ||
              nameLower.includes(`grade${grade}`) ||
              nameLower.includes(`garade ${grade}`) ||
              nameLower.includes(`garade${grade}`) ||
              nameLower.includes(`std ${grade}`) ||
              nameLower.includes(`std${grade}`) ||
              nameLower.includes(`class ${grade}`) ||
              nameLower.includes(`class${grade}`)
            ) {
              subcategory = `Workbooks - Grade ${grade}`;
              break;
            }
          }
        }
        // Check for Secondary School (Form 1-4)
        else if (
          nameLower.includes("form 1") ||
          nameLower.includes("form1") ||
          nameLower.includes("form one")
        ) {
          subcategory = "Form 1 - Secondary";
        } else if (
          nameLower.includes("form 2") ||
          nameLower.includes("form2") ||
          nameLower.includes("form two")
        ) {
          subcategory = "Form 2 - Secondary";
        } else if (
          nameLower.includes("form 3") ||
          nameLower.includes("form3") ||
          nameLower.includes("form three")
        ) {
          subcategory = "Form 3 - Secondary";
        } else if (
          nameLower.includes("form 4") ||
          nameLower.includes("form4") ||
          nameLower.includes("form four")
        ) {
          subcategory = "Form 4 - Secondary";
        }
        // Check for grades 1-10 (Primary School) - check from highest to lowest to avoid 10 matching as 1
        else {
          for (let grade = 10; grade >= 1; grade--) {
            if (
              nameLower.includes(`grade ${grade}`) ||
              nameLower.includes(`grade${grade}`) ||
              nameLower.includes(`garade ${grade}`) ||
              nameLower.includes(`garade${grade}`) ||
              nameLower.includes(`std ${grade}`) ||
              nameLower.includes(`std${grade}`) ||
              nameLower.includes(`class ${grade}`) ||
              nameLower.includes(`class${grade}`)
            ) {
              subcategory = `Grade ${grade} - Textbooks`;
              break;
            }
          }
        }

        // Final check: if it contains educational subject keywords, move to "Educational - Other"
        // This catches textbooks that don't have grade numbers
        const educationalKeywords = [
          "mathematics",
          "math",
          "maths",
          "english",
          "kiswahili",
          "swahili",
          "science",
          "social",
          "studies",
          "chemistry",
          "physics",
          "biology",
          "history",
          "geography",
          "cre",
          "ire",
          "business",
          "agriculture",
          "computer",
          "textbook",
          "coursebook",
          "learner",
          "teacher",
          "scheme",
          "notes",
          "exam",
          "test",
          "assessment",
        ];

        const hasEducationalKeyword = educationalKeywords.some((keyword) =>
          nameLower.includes(keyword)
        );

        // Check for exercise books with specific types
        const isExerciseBook =
          nameLower.includes("excess book") ||
          nameLower.includes("excss") ||
          nameLower.includes("excees") ||
          nameLower.includes("excess math") ||
          nameLower.includes("quire") ||
          nameLower.includes("cash book") ||
          nameLower.includes("graph book");

        if (isExerciseBook) {
          // Subcategorize exercise books by type
          if (nameLower.includes("cash book")) {
            subcategory = "Exercise Books - Cash Books";
          } else if (nameLower.includes("graph book")) {
            if (nameLower.includes("a4")) {
              subcategory = "Exercise Books - Graph Books A4";
            } else if (nameLower.includes("a5")) {
              subcategory = "Exercise Books - Graph Books A5";
            } else {
              subcategory = "Exercise Books - Graph Books";
            }
          } else if (
            nameLower.includes("a4 200") ||
            nameLower.includes("a4200")
          ) {
            subcategory = "Exercise Books - A4 200 Pages";
          } else if (
            nameLower.includes("a5 200") ||
            nameLower.includes("a5200")
          ) {
            subcategory = "Exercise Books - A5 200 Pages";
          } else if (nameLower.includes("a4") && !nameLower.includes("200")) {
            subcategory = "Exercise Books - A4";
          } else if (nameLower.includes("A5") && !nameLower.includes("200")) {
            subcategory = "Exercise Books - A5";
          } else if (
            nameLower.includes("1quire") ||
            nameLower.includes("1 quire")
          ) {
            subcategory = "Exercise Books - 1 Quire";
          } else if (
            nameLower.includes("2quire") ||
            nameLower.includes("2 quire")
          ) {
            subcategory = "Exercise Books - 2 Quires";
          } else if (
            nameLower.includes("3quire") ||
            nameLower.includes("3 quire")
          ) {
            subcategory = "Exercise Books - 3 Quires";
          } else if (
            nameLower.includes("4quire") ||
            nameLower.includes("4 quire")
          ) {
            subcategory = "Exercise Books - 4 Quires";
          } else if (
            nameLower.includes("6quire") ||
            nameLower.includes("6 quire")
          ) {
            subcategory = "Exercise Books - 6 Quires";
          } else {
            subcategory = "Exercise Books - Other";
          }
        }
        // Check for notebooks (stationery items, not story books)
        else if (
          (nameLower.includes("notebook") ||
            nameLower.includes("note book") ||
            nameLower.includes("composition book") ||
            nameLower.includes("writing book")) &&
          !nameLower.includes("workbook") &&
          !nameLower.includes("activity")
        ) {
          subcategory = "Notebooks & Stationery";
        }
        // Check for atlas books
        else if (nameLower.includes("atlas")) {
          subcategory = "Atlas Books";
        }

        if (!subcategories.has(subcategory)) {
          subcategories.set(subcategory, []);
        }
        subcategories.get(subcategory)!.push(product);
      } else {
        // For other categories, just use "All Items"
        const subcategory = "All Items";
        if (!subcategories.has(subcategory)) {
          subcategories.set(subcategory, []);
        }
        subcategories.get(subcategory)!.push(product);
      }
    });

    return categories;
  }, [products]);

  // Get filtered products if searching
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];

    return products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const categoryCount = organizedData.size;
    let subcategoryCount = 0;
    organizedData.forEach((subs) => {
      subcategoryCount += subs.size;
    });
    return {
      categories: categoryCount,
      subcategories: subcategoryCount,
      products: products.length,
      inStock: products.filter((p) => p.quantity_in_stock > 0).length,
    };
  }, [organizedData, products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Category View
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                  <Layers className="w-8 h-8 text-purple-400" />
                  Organized Inventory
                </h1>
                <p className="text-purple-200 mt-1">
                  Browse products by category and grade
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-white shadow-lg backdrop-blur-xl">
                <p className="text-sm text-blue-200">Categories</p>
                <p className="text-3xl font-bold">{stats.categories}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4 text-white shadow-lg backdrop-blur-xl">
                <p className="text-sm text-purple-200">Subcategories</p>
                <p className="text-3xl font-bold">{stats.subcategories}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30 rounded-xl p-4 text-white shadow-lg backdrop-blur-xl">
                <p className="text-sm text-indigo-200">Total Products</p>
                <p className="text-3xl font-bold">{stats.products}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-white shadow-lg backdrop-blur-xl">
                <p className="text-sm text-green-200">In Stock</p>
                <p className="text-3xl font-bold">{stats.inStock}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="Quick search for any product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Search Results */}
            {searchTerm && filteredProducts.length > 0 && (
              <div className="mt-4 bg-white/5 border-2 border-purple-500/30 rounded-xl p-4 max-h-96 overflow-y-auto backdrop-blur-xl">
                <h3 className="font-bold text-white mb-3">
                  Search Results ({filteredProducts.length})
                </h3>
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded border-2 border-white/20 shadow"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center border border-white/20">
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {product.name}
                          </p>
                          <p className="text-sm text-slate-300">
                            {product.category} • Stock:{" "}
                            {product.quantity_in_stock}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-400">
                          KES {Number(product.selling_price).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          {product.product_id}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchTerm && filteredProducts.length === 0 && (
              <div className="mt-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl p-6 text-center backdrop-blur-xl">
                <p className="text-red-200 font-medium">
                  No products found for "{searchTerm}"
                </p>
              </div>
            )}
          </div>

          {/* Categories Grid */}
          {!searchTerm && (
            <>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-purple-400" />
                Browse by Category
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(organizedData.entries())
                  .sort(([a], [b]) => {
                    // Put Books first
                    if (a.toLowerCase() === "books") return -1;
                    if (b.toLowerCase() === "books") return 1;
                    return a.localeCompare(b);
                  })
                  .map(([category, subcategories]) => {
                    const totalProducts = Array.from(
                      subcategories.values()
                    ).reduce((sum, prods) => sum + prods.length, 0);
                    const inStockCount = Array.from(subcategories.values())
                      .flat()
                      .filter((p) => p.quantity_in_stock > 0).length;

                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="group bg-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-purple-500 rounded-xl p-6 transition-all hover:shadow-2xl hover:scale-105 text-left"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            {category.toLowerCase() === "books" ? (
                              <BookOpen className="w-7 h-7 text-white" />
                            ) : (
                              <Package className="w-7 h-7 text-white" />
                            )}
                          </div>
                          <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {category}
                        </h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-300">
                            {subcategories.size}{" "}
                            {subcategories.size === 1 ? "folder" : "folders"}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">
                            {totalProducts} items
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <span className="text-xs text-green-400 font-medium">
                            ✓ {inStockCount} in stock
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Subcategory View
  const subcategories = organizedData.get(selectedCategory)!;
  if (!selectedSubcategory && !selectedGroup) {
    // Group subcategories that should be grouped (Revision Books, Dictionaries, Exercise Books)
    const groupedSubcategories = new Map<string, Map<string, Product[]>>();
    const standaloneSubcategories = new Map<string, Product[]>();

    const groupNames = ["Revision Books", "Dictionaries", "Exercise Books"];

    subcategories.forEach((products, subcategory) => {
      let isGrouped = false;

      // Check if this subcategory belongs to a group
      for (const groupName of groupNames) {
        if (subcategory.startsWith(groupName + " - ")) {
          const subname = subcategory.substring(groupName.length + 3); // Remove "GroupName - "
          if (!groupedSubcategories.has(groupName)) {
            groupedSubcategories.set(groupName, new Map());
          }
          groupedSubcategories.get(groupName)!.set(subname, products);
          isGrouped = true;
          break;
        }
      }

      // If not grouped, add to standalone
      if (!isGrouped) {
        standaloneSubcategories.set(subcategory, products);
      }
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-6 flex items-center gap-2 text-purple-300 hover:text-purple-100 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Categories
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
              {selectedCategory.toLowerCase() === "books" ? (
                <BookOpen className="w-8 h-8 text-purple-400" />
              ) : (
                <Package className="w-8 h-8 text-purple-400" />
              )}
              {selectedCategory}
            </h1>
            <p className="text-purple-200">
              Select a subfolder to view products
            </p>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Combine and sort all folders */}
            {(() => {
              const allFolders: Array<{
                type: "group" | "standalone";
                name: string;
                data: Map<string, Product[]> | Product[];
                order: number;
              }> = [];

              // Add grouped folders
              groupedSubcategories.forEach((subItems, group) => {
                const orderMap: Record<string, number> = {
                  "Revision Books": 40,
                  Dictionaries: 50,
                  "Exercise Books": 35,
                };
                allFolders.push({
                  type: "group",
                  name: group,
                  data: subItems,
                  order: orderMap[group] || 100,
                });
              });

              // Add standalone folders
              standaloneSubcategories.forEach((products, subcategory) => {
                const getOrder = (name: string) => {
                  // Pre-Primary
                  if (name === "Pre-Primary - PP1") return 1;
                  if (name === "Pre-Primary - PP2") return 2;
                  if (name === "Pre-Primary - General") return 3;
                  // Primary Grades
                  if (name === "Grade 1 - Textbooks") return 10;
                  if (name === "Grade 2 - Textbooks") return 11;
                  if (name === "Grade 3 - Textbooks") return 12;
                  if (name === "Grade 4 - Textbooks") return 13;
                  if (name === "Grade 5 - Textbooks") return 14;
                  if (name === "Grade 6 - Textbooks") return 15;
                  if (name === "Grade 7 - Textbooks") return 16;
                  if (name === "Grade 8 - Textbooks") return 17;
                  if (name === "Grade 9 - Textbooks") return 18;
                  // Secondary Forms
                  if (name === "Form 1 - Secondary") return 20;
                  if (name === "Form 2 - Secondary") return 21;
                  if (name === "Form 3 - Secondary") return 22;
                  if (name === "Form 4 - Secondary") return 23;
                  // Workbooks
                  if (name.startsWith("Workbooks")) return 30;
                  // Others
                  if (name === "Quran") return 55;
                  if (name === "Story Books") return 60;
                  if (name === "Atlas Books") return 70;
                  if (name === "Notebooks & Stationery") return 80;
                  if (name === "Educational - Other") return 90;
                  return 100; // Default
                };
                allFolders.push({
                  type: "standalone",
                  name: subcategory,
                  data: products,
                  order: getOrder(subcategory),
                });
              });

              // Sort all folders by order
              return allFolders
                .sort((a, b) => a.order - b.order)
                .map((folder) => {
                  if (folder.type === "group") {
                    const subItems = folder.data as Map<string, Product[]>;
                    const totalProducts = Array.from(subItems.values()).reduce(
                      (sum, prods) => sum + prods.length,
                      0
                    );
                    const inStockCount = Array.from(subItems.values()).reduce(
                      (sum, prods) =>
                        sum +
                        prods.filter((p) => p.quantity_in_stock > 0).length,
                      0
                    );

                    return (
                      <button
                        key={folder.name}
                        onClick={() => {
                          setSelectedGroup(folder.name);
                          setCurrentPage(1);
                        }}
                        className="group bg-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-indigo-500 rounded-xl p-5 transition-all hover:shadow-2xl hover:scale-105 text-left"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <FolderOpen className="w-6 h-6 text-white" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          {folder.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-300">
                            {subItems.size}{" "}
                            {subItems.size === 1 ? "type" : "types"}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">
                            {totalProducts} items
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-green-400 font-medium">
                            {inStockCount} in stock
                          </span>
                        </div>
                      </button>
                    );
                  } else {
                    const products = folder.data as Product[];
                    const inStockCount = products.filter(
                      (p) => p.quantity_in_stock > 0
                    ).length;

                    return (
                      <button
                        key={folder.name}
                        onClick={() => {
                          setSelectedSubcategory(folder.name);
                          setCurrentPage(1);
                        }}
                        className="group bg-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-indigo-500 rounded-xl p-5 transition-all hover:shadow-2xl hover:scale-105 text-left"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <FolderOpen className="w-6 h-6 text-white" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                          {folder.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-300">
                            {products.length} items
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-green-400 font-medium">
                            {inStockCount} in stock
                          </span>
                        </div>
                      </button>
                    );
                  }
                });
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Group detail view (e.g., Revision Books showing Targeter, Signal, etc.)
  if (selectedGroup && !selectedSubcategory) {
    const groupSubcategories = new Map<string, Product[]>();

    subcategories.forEach((products, subcategory) => {
      if (subcategory.startsWith(selectedGroup + " - ")) {
        const subname = subcategory.split(" - ")[1];
        groupSubcategories.set(subname, products);
      }
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedGroup(null)}
            className="mb-6 flex items-center gap-2 text-purple-300 hover:text-purple-100 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to {selectedCategory}
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
              <FolderOpen className="w-8 h-8 text-purple-400" />
              {selectedGroup}
            </h1>
            <p className="text-purple-200">Select a type to view products</p>
          </div>

          {/* Group Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from(groupSubcategories.entries())
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([subname, products]) => {
                const inStockCount = products.filter(
                  (p) => p.quantity_in_stock > 0
                ).length;

                return (
                  <button
                    key={subname}
                    onClick={() => {
                      setSelectedSubcategory(selectedGroup + " - " + subname);
                      setCurrentPage(1);
                    }}
                    className="group bg-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-indigo-500 rounded-xl p-5 transition-all hover:shadow-2xl hover:scale-105 text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {subname}
                    </h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-300">
                        {products.length} items
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-green-400 font-medium">
                        {inStockCount} in stock
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // Products View (existing code continues...)
  if (!selectedSubcategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-6 flex items-center gap-2 text-purple-300 hover:text-purple-100 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Categories
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
              {selectedCategory.toLowerCase() === "books" ? (
                <BookOpen className="w-8 h-8 text-purple-400" />
              ) : (
                <Package className="w-8 h-8 text-purple-400" />
              )}
              {selectedCategory}
            </h1>
            <p className="text-purple-200">
              Select a subfolder to view products
            </p>
          </div>

          {/* Subcategories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from(subcategories.entries())
              .sort(([a], [b]) => {
                // Custom sorting order for better organization
                const getOrder = (name: string) => {
                  if (name.startsWith("Pre-Primary - PP1")) return 1;
                  if (name.startsWith("Pre-Primary - PP2")) return 2;
                  if (name.startsWith("Pre-Primary - General")) return 3;
                  if (name.startsWith("Grade 1")) return 10;
                  if (name.startsWith("Grade 2")) return 11;
                  if (name.startsWith("Grade 3")) return 12;
                  if (name.startsWith("Grade 4")) return 13;
                  if (name.startsWith("Grade 5")) return 14;
                  if (name.startsWith("Grade 6")) return 15;
                  if (name.startsWith("Grade 7")) return 16;
                  if (name.startsWith("Grade 8")) return 17;
                  if (name.startsWith("Grade 9")) return 18;
                  if (name.startsWith("Form 1")) return 20;
                  if (name.startsWith("Form 2")) return 21;
                  if (name.startsWith("Form 3")) return 22;
                  if (name.startsWith("Form 4")) return 23;
                  if (name.startsWith("Workbooks")) return 30;
                  if (name.startsWith("Revision Books - Targeter")) return 40;
                  if (name.startsWith("Revision Books - Signal")) return 41;
                  if (name.startsWith("Revision Books - Highflyer")) return 42;
                  if (name.startsWith("Revision Books - Encyclopedia"))
                    return 43;
                  if (name.startsWith("Revision Books - Other")) return 44;
                  if (name.startsWith("Dictionaries - Oxford")) return 50;
                  if (name.startsWith("Dictionaries - Kamusi")) return 51;
                  if (name.startsWith("Dictionaries - Longhorn")) return 52;
                  if (name.startsWith("Dictionaries - EAEP")) return 53;
                  if (name.startsWith("Dictionaries - Other")) return 54;
                  if (name === "Quran") return 55;
                  if (name === "Story Books") return 60;
                  if (name === "Atlas Books") return 70;
                  if (name === "Notebooks & Stationery") return 80;
                  if (name === "Educational - Other") return 90;
                  return 100; // Default for anything else
                };
                return getOrder(a) - getOrder(b);
              })
              .map(([subcategory, products]) => {
                const inStockCount = products.filter(
                  (p) => p.quantity_in_stock > 0
                ).length;

                return (
                  <button
                    key={subcategory}
                    onClick={() => {
                      setSelectedSubcategory(subcategory);
                      setCurrentPage(1);
                    }}
                    className="group bg-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-indigo-500 rounded-xl p-5 transition-all hover:shadow-2xl hover:scale-105 text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {subcategory}
                    </h3>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-300">
                        {products.length} items
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-green-400 font-medium">
                        {inStockCount} in stock
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // Products View
  const productsInSubcategory = subcategories.get(selectedSubcategory)!;

  // Pagination calculations
  const totalPages = Math.ceil(productsInSubcategory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = productsInSubcategory.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSelectedGroup(null);
              setCurrentPage(1);
            }}
            className="text-purple-300 hover:text-purple-100 font-medium transition-colors"
          >
            Categories
          </button>
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <button
            onClick={() => {
              setSelectedSubcategory(null);
              setSelectedGroup(null);
              setCurrentPage(1);
            }}
            className="text-purple-300 hover:text-purple-100 font-medium transition-colors"
          >
            {selectedCategory}
          </button>
          {selectedGroup && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <button
                onClick={() => {
                  setSelectedSubcategory(null);
                  setCurrentPage(1);
                }}
                className="text-purple-300 hover:text-purple-100 font-medium transition-colors"
              >
                {selectedGroup}
              </button>
            </>
          )}
          <ChevronRight className="w-4 h-4 text-slate-500" />
          <span className="text-purple-400 font-bold">
            {selectedSubcategory}
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            {selectedSubcategory}
          </h1>
          <p className="text-purple-200">
            {productsInSubcategory.length} products •{" "}
            {
              productsInSubcategory.filter((p) => p.quantity_in_stock > 0)
                .length
            }{" "}
            in stock
            {totalPages > 1 && (
              <span className="ml-2">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white/5 backdrop-blur-xl border-2 border-white/20 rounded-xl overflow-hidden hover:border-purple-500 hover:shadow-2xl transition-all group text-left cursor-pointer"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-slate-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-300" />
                  </div>
                )}
                {product.quantity_in_stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      OUT OF STOCK
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                  {product.name}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Stock:</span>
                    <span
                      className={`font-bold ${
                        product.quantity_in_stock > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {product.quantity_in_stock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Price:</span>
                    <span className="font-bold text-purple-400">
                      KES {Number(product.selling_price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">ID:</span>
                    <span className="font-mono text-xs text-slate-300">
                      {product.product_id}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {productsInSubcategory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No products in this folder</p>
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-2 border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/20 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-white">
                  Product Details
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Image */}
                  <div className="space-y-4">
                    <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden">
                      {selectedProduct.image_url ? (
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-24 h-24 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex gap-2">
                      {selectedProduct.featured && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium border border-yellow-500/30">
                          ⭐ Featured
                        </span>
                      )}
                      {selectedProduct.published ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium border border-green-500/30">
                          ✓ Published
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium border border-red-500/30">
                          ✗ Unpublished
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Information */}
                  <div className="space-y-6">
                    {/* Product Name */}
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">
                        {selectedProduct.name}
                      </h3>
                      {selectedProduct.description && (
                        <p className="text-purple-200 leading-relaxed">
                          {selectedProduct.description}
                        </p>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {/* Category */}
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Tag className="w-5 h-5 text-purple-300" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Category</p>
                            <p className="text-lg font-semibold text-white">
                              {selectedProduct.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Product ID */}
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Barcode className="w-5 h-5 text-blue-300" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Product ID</p>
                            <p className="text-lg font-semibold text-white font-mono">
                              {selectedProduct.product_id}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Package className="w-5 h-5 text-indigo-300" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">
                              Stock Available
                            </p>
                            <p
                              className={`text-lg font-semibold ${
                                selectedProduct.quantity_in_stock > 10
                                  ? "text-green-400"
                                  : selectedProduct.quantity_in_stock > 0
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {selectedProduct.quantity_in_stock} units
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <DollarSign className="w-5 h-5 text-green-300" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-400">
                                Selling Price
                              </p>
                              <p className="text-2xl font-bold text-green-400">
                                KES{" "}
                                {selectedProduct.selling_price?.toLocaleString() ||
                                  "0"}
                              </p>
                            </div>
                          </div>
                          <div className="pl-11">
                            <p className="text-sm text-slate-400">
                              Buying Price
                            </p>
                            <p className="text-lg font-semibold text-slate-300">
                              KES{" "}
                              {selectedProduct.buying_price?.toLocaleString() ||
                                "0"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profit Margin */}
                      {selectedProduct.buying_price &&
                        selectedProduct.selling_price && (
                          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/30 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-300" />
                              </div>
                              <div>
                                <p className="text-sm text-purple-200">
                                  Profit Margin
                                </p>
                                <p className="text-2xl font-bold text-purple-300">
                                  KES{" "}
                                  {(
                                    selectedProduct.selling_price -
                                    selectedProduct.buying_price
                                  ).toLocaleString()}
                                  <span className="text-sm ml-2 text-purple-400">
                                    (
                                    {(
                                      ((selectedProduct.selling_price -
                                        selectedProduct.buying_price) /
                                        selectedProduct.buying_price) *
                                      100
                                    ).toFixed(1)}
                                    %)
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  const showEllipsisBefore =
                    page === currentPage - 2 && currentPage > 3;
                  const showEllipsisAfter =
                    page === currentPage + 2 && currentPage < totalPages - 2;

                  if (!showPage && !showEllipsisBefore && !showEllipsisAfter) {
                    return null;
                  }

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <span key={page} className="px-2 text-slate-400">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 z-40 border-2 border-white/20"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            // Refetch products after edit
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
