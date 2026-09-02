// Países con sus regiones y principales ciudades, para el selector del onboarding.
// Diseño listo para expandir a otros países: cada país agrupa sus regiones
// (optgroup) con sus ciudades (option). Para agregar uno nuevo, solo se añade
// un bloque a COUNTRY_OPTIONS y el formulario lo muestra automáticamente.
export interface ChileRegion {
  id: string;
  label: string; // etiqueta del optgroup, ej. "Región de Coquimbo"
  cities: string[];
}

export type RegionOption = ChileRegion;

export interface CountryOption {
  code: string; // código ISO-2
  name: string; // etiqueta del país en el desplegable
  regions: ChileRegion[]; // regiones del país (cada una con sus ciudades)
}

// Actualmente solo Chile está disponible (Bryan: "por mientras requiero solo
// Chile, pero mi idea es expandir a otros países"). País nuevo = nuevo bloque.
export const COUNTRY_OPTIONS: CountryOption[] = [
  {
    code: "cl",
    name: "Chile",
    regions: [
      { id: "arica", label: "Región de Arica y Parinacota", cities: ["Arica", "Putre", "Camarones", "General Lagos"] },
      { id: "tarapaca", label: "Región de Tarapacá", cities: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Pica", "Huara", "Camiña", "Colchane"] },
      { id: "antofagasta", label: "Región de Antofagasta", cities: ["Antofagasta", "Calama", "Tocopilla", "San Pedro de Atacama", "Mejillones", "Taltal", "María Elena"] },
      { id: "atacama", label: "Región de Atacama", cities: ["Copiapó", "Vallenar", "Caldera", "Chañaral", "Huasco", "Tierra Amarilla", "Diego de Almagro"] },
      { id: "coquimbo", label: "Región de Coquimbo", cities: ["La Serena", "Coquimbo", "Ovalle", "Illapel", "Vicuña", "Los Vilos", "Salamanca", "Combarbalá", "Monte Patria", "Punitaqui"] },
      { id: "valparaiso", label: "Región de Valparaíso", cities: ["Valparaíso", "Viña del Mar", "Quillota", "San Antonio", "Los Andes", "San Felipe", "Quilpué", "Villa Alemana", "Concón", "Casablanca", "La Calera"] },
      { id: "metropolitana", label: "Región Metropolitana de Santiago", cities: ["Santiago", "Puente Alto", "Maipú", "La Florida", "Las Condes", "Providencia", "Ñuñoa", "Estación Central", "San Bernardo", "Pudahuel"] },
      { id: "ohiggins", label: "Región del Libertador General Bernardo O'Higgins", cities: ["Rancagua", "San Fernando", "Rengo", "Machalí", "Santa Cruz", "Pichilemu", "Peumo"] },
      { id: "maule", label: "Región del Maule", cities: ["Talca", "Curicó", "Linares", "Constitución", "Parral", "Molina", "Cauquenes"] },
      { id: "nuble", label: "Región de Ñuble", cities: ["Chillán", "San Carlos", "Bulnes", "Quirihue", "Chillán Viejo"] },
      { id: "biobio", label: "Región del Biobío", cities: ["Concepción", "Talcahuano", "Coronel", "Los Ángeles", "Lota", "Hualqui", "San Pedro de la Paz"] },
      { id: "araucania", label: "Región de la Araucanía", cities: ["Temuco", "Angol", "Villarrica", "Pucón", "Victoria", "Nueva Imperial"] },
      { id: "losrios", label: "Región de Los Ríos", cities: ["Valdivia", "La Unión", "Panguipulli", "Río Bueno", "Paillaco"] },
      { id: "loslagos", label: "Región de Los Lagos", cities: ["Puerto Montt", "Osorno", "Castro", "Puerto Varas", "Ancud", "Calbuco", "Frutillar"] },
      { id: "aysen", label: "Región de Aysén del General Carlos Ibáñez del Campo", cities: ["Coyhaique", "Puerto Aysén", "Chile Chico", "Cochrane"] },
      { id: "magallanes", label: "Región de Magallanes y de la Antártica Chilena", cities: ["Punta Arenas", "Puerto Natales", "Porvenir", "Cabo de Hornos"] },
    ],
  },
];