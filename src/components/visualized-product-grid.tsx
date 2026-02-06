// @ts-nocheck
// components/VirtualizedProductGrid.tsx
import { Grid } from "react-window";
// import AutoSizer from "react-virtualized-auto-sizer";
import ProductCard from "./product-card";
import { Product } from "@/types/store";

interface VirtualizedProductGridProps {
  products: Product[];
  columnCount?: number;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
}

const VirtualizedProductGrid = ({
  products,
  columnCount = 3,
}: VirtualizedProductGridProps) => {
  const Cell = ({ columnIndex, rowIndex, style }: CellProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const product = products[index];

    if (!product) return null;

    return (
      <div style={style} className="p-2">
        <ProductCard
          product={product}
          isClicked={false}
          onAddToCart={() => {}}
          isInStock={true}
          // ... props
        />
      </div>
    );
  };

  return (
    <div style={{ height: "800px", width: "100%" }}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnCount}
        rowCount={Math.ceil(products.length / columnCount)}
        rowHeight={400}
        width={100}
        height={800}
      >
        {Cell}
      </Grid>
    </div>
  );
};
