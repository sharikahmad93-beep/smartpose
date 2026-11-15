'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface RecipeItem {
  id: string;
  dishName: string;
  category: string;
  sellingPrice: number;
  foodCost: number;
  costPercentage: number;
  ingredients: { name: string; qty: string; cost: number }[];
  margin: number;
}

const RECIPES: RecipeItem[] = [
  {
    id: 'rcp-1',
    dishName: 'Royal Chicken Dum Biryani',
    category: 'Biryani Specials',
    sellingPrice: 340,
    foodCost: 92.4,
    costPercentage: 27.2,
    margin: 72.8,
    ingredients: [
      { name: 'Fresh Chicken Curry Cut', qty: '260 gm', cost: 46.8 },
      { name: 'Daawat Basmati Rice XXL', qty: '180 gm', cost: 19.8 },
      { name: 'Pure Cow Desi Ghee', qty: '25 gm', cost: 14.5 },
      { name: 'Kashmir Mogra Saffron', qty: '0.02 gm', cost: 5.6 },
      { name: 'Biryani Whole Spices & Mint', qty: 'Batch', cost: 5.7 },
    ],
  },
  {
    id: 'rcp-2',
    dishName: 'Special Mutton Dum Biryani',
    category: 'Biryani Specials',
    sellingPrice: 460,
    foodCost: 142.0,
    costPercentage: 30.8,
    margin: 69.2,
    ingredients: [
      { name: 'Baby Mutton Biryani Cut', qty: '280 gm', cost: 98.0 },
      { name: 'Daawat Basmati Rice XXL', qty: '180 gm', cost: 19.8 },
      { name: 'Pure Cow Desi Ghee', qty: '30 gm', cost: 17.4 },
      { name: 'Kashmir Saffron & Spices', qty: 'Batch', cost: 6.8 },
    ],
  },
  {
    id: 'rcp-3',
    dishName: 'Crispy Andhra Chicken 65',
    category: 'Starters',
    sellingPrice: 310,
    foodCost: 74.5,
    costPercentage: 24.0,
    margin: 76.0,
    ingredients: [
      { name: 'Boneless Chicken Cubes', qty: '220 gm', cost: 48.4 },
      { name: 'Corn Flour, Egg & Masala', qty: 'Batch', cost: 14.2 },
      { name: 'Curry Leaves, Green Chilli & Oil', qty: 'Batch', cost: 11.9 },
    ],
  },
  {
    id: 'rcp-4',
    dishName: 'Paneer Butter Masala',
    category: 'Main Curries',
    sellingPrice: 310,
    foodCost: 78.2,
    costPercentage: 25.2,
    margin: 74.8,
    ingredients: [
      { name: 'Fresh Malai Paneer Block', qty: '180 gm', cost: 57.6 },
      { name: 'Butter Makhani Tomato Gravy', qty: '200 ml', cost: 14.8 },
      { name: 'Fresh Cream & Kasuri Methi', qty: 'Batch', cost: 5.8 },
    ],
  },
];

export default function RecipeCostingPage() {
  const [recipes] = useState<RecipeItem[]>(RECIPES);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab="recipes" />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recipe Management &amp; Food Costing</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Portion Yield Engine
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Ingredient level BOM (Bill of Materials), raw material auto-deduction, and portion cost analysis.
            </p>
          </div>
        </header>

        {/* Recipes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          {recipes.map((rcp) => (
            <div
              key={rcp.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{rcp.dishName}</h3>
                  <span className="text-xs text-slate-400">{rcp.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rcp.margin}% Gross Margin
                  </span>
                </div>
              </div>

              {/* Price & Cost Comparison */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Menu Selling Price</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{rcp.sellingPrice}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Raw Food Cost</span>
                  <p className="font-mono font-bold text-orange-600 text-sm mt-0.5">₹{rcp.foodCost.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Food Cost %</span>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{rcp.costPercentage}%</p>
                </div>
              </div>

              {/* Ingredients Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 text-[11px] block">Ingredient Mapping (BOM per portion):</span>
                {rcp.ingredients.map((ing, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-600 text-[11px]">
                    <span>• {ing.name} ({ing.qty})</span>
                    <span className="font-mono font-semibold text-slate-800">₹{ing.cost.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
