import { BookOpen, Backpack, Laptop, Pencil, Grid } from "lucide-react";
import Container from "./Container";
import Card from "./Card";

const categories = [
  {
    name: "Books",
    icon: BookOpen,
    count: "1000+",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    darkBgGradient: "dark:from-blue-950 dark:to-cyan-950",
  },
  {
    name: "Backpacks",
    icon: Backpack,
    count: "500+",
    gradient: "from-emerald-500 to-green-500",
    bgGradient: "from-emerald-50 to-green-50",
    darkBgGradient: "dark:from-emerald-950 dark:to-green-950",
  },
  {
    name: "Electronics",
    icon: Laptop,
    count: "300+",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    darkBgGradient: "dark:from-amber-950 dark:to-orange-950",
  },
  {
    name: "Stationery",
    icon: Pencil,
    count: "2000+",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-50 to-yellow-50",
    darkBgGradient: "dark:from-amber-950 dark:to-yellow-950",
  },
  {
    name: "All Products",
    icon: Grid,
    count: "5000+",
    gradient: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-50 to-pink-50",
    darkBgGradient: "dark:from-rose-950 dark:to-pink-950",
  },
];

interface CategoryGridProps {
  onCategoryClick?: (category: string) => void;
}

export default function CategoryGrid({ onCategoryClick }: CategoryGridProps) {
  return (
    <section className="py-12 lg:py-16">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Shop By Category
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Find exactly what you need from our diverse collection
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                variant="elevated"
                padding="none"
                hoverable
                onClick={() =>
                  onCategoryClick?.(
                    category.name === "All Products" ? "all" : category.name,
                  )
                }
                className="cursor-pointer group"
              >
                <div
                  className={`p-6 bg-gradient-to-br ${category.bgGradient} ${category.darkBgGradient} h-full flex flex-col items-center justify-center text-center space-y-4 transition-all duration-300 group-hover:scale-105`}
                >
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}
                  >
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {category.count} items
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
