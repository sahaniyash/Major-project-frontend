export const naiveBayesModels = {
  bernoulli_nb: {
    alpha: { type: "float", default: 1.0, min: 0 },
    force_alpha: { type: "bool", default: true },
    binarize: { type: "float", default: 0.0, min: 0 },
    fit_prior: { type: "bool", default: true },
    class_prior: { type: ["array", "None"], default: null },
  },
  categorical_nb: {
    alpha: { type: "float", default: 1.0, min: 0 },
    force_alpha: { type: "bool", default: true },
    fit_prior: { type: "bool", default: true },
    class_prior: { type: ["array", "None"], default: null },
    min_categories: { type: ["int", "array", "None"], default: null, min: 1 },
  },
  complement_nb: {
    alpha: { type: "float", default: 1.0, min: 0 },
    force_alpha: { type: "bool", default: true },
    fit_prior: { type: "bool", default: true },
    class_prior: { type: ["array", "None"], default: null },
    norm: { type: "bool", default: false },
  },
  gaussian_nb: {
    priors: { type: ["array", "None"], default: null },
    var_smoothing: { type: "float", default: 1e-9, min: 0 },
  },
  multinomial_nb: {
    alpha: { type: "float", default: 1.0, min: 0 },
    force_alpha: { type: "bool", default: true },
    fit_prior: { type: "bool", default: true },
    class_prior: { type: ["array", "None"], default: null },
  },
};