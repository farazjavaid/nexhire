"use client";
import dynamic from "next/dynamic";

const ProductSales = dynamic(() => import("./ProductSales"), { ssr: false });

export default function ProductSalesClient() {
  return <ProductSales />;
}
