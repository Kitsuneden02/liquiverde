export const CATEGORY_LABELS = {
  abarrotes_y_cereales: 'Abarrotes y Cereales',
  bebidas: 'Bebidas',
  despensa_y_condimentos: 'Despensa y Condimentos',
  frutas_y_verduras: 'Frutas y Verduras',
  lacteos_y_vegetales: 'Lácteos y Vegetales',
  limpieza_y_hogar: 'Limpieza y Hogar',
  panaderia_y_snacks: 'Panadería y Snacks',
  proteinas_y_legumbres: 'Proteínas y Legumbres'
};

export function formatCategoryName(cat) {
  if (!cat) return '';
  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
  return cat
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
}
