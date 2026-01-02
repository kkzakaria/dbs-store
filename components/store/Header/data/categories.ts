import {
    Headphones,
    Laptop,
    type LucideIcon,
    Smartphone,
    Tablet,
    Watch,
} from "lucide-react";

export interface FeaturedProduct {
    name: string;
    href: string;
    image: string;
}

export interface Category {
    name: string;
    icon: LucideIcon;
    href: string;
    color: string;
    featured: FeaturedProduct[];
    brands: string[];
}

export const categories: Category[] = [
    {
        name: "Smartphones",
        icon: Smartphone,
        href: "/categories/smartphones",
        color: "from-blue-500 to-cyan-400",
        featured: [
            {
                name: "iPhone 15 Pro",
                href: "/products/iphone-15-pro",
                image: "/images/products/iphone.jpg",
            },
            {
                name: "Samsung S24",
                href: "/products/samsung-s24",
                image: "/images/products/samsung.jpg",
            },
        ],
        brands: ["Apple", "Samsung", "Xiaomi", "Huawei"],
    },
    {
        name: "Montres",
        icon: Watch,
        href: "/categories/montres-connectees",
        color: "from-purple-500 to-pink-400",
        featured: [
            {
                name: "Apple Watch",
                href: "/products/apple-watch",
                image: "/images/products/watch.jpg",
            },
        ],
        brands: ["Apple", "Samsung", "Garmin"],
    },
    {
        name: "Tablettes",
        icon: Tablet,
        href: "/categories/tablettes",
        color: "from-orange-500 to-amber-400",
        featured: [
            {
                name: "iPad Pro",
                href: "/products/ipad-pro",
                image: "/images/products/ipad.jpg",
            },
        ],
        brands: ["Apple", "Samsung", "Lenovo"],
    },
    {
        name: "Ordinateurs",
        icon: Laptop,
        href: "/categories/ordinateurs",
        color: "from-green-500 to-emerald-400",
        featured: [
            {
                name: "MacBook Pro",
                href: "/products/macbook-pro",
                image: "/images/products/macbook.jpg",
            },
        ],
        brands: ["Apple", "Dell", "HP", "Lenovo"],
    },
    {
        name: "Accessoires",
        icon: Headphones,
        href: "/categories/accessoires",
        color: "from-rose-500 to-red-400",
        featured: [
            {
                name: "AirPods Pro",
                href: "/products/airpods-pro",
                image: "/images/products/airpods.jpg",
            },
        ],
        brands: ["Apple", "Samsung", "Sony", "JBL"],
    },
];
