export const naiveBayesModels = {
  bernoulli_nb: {
    alpha: 1.0,
    force_alpha: true,
    binarize: 0.0,
    fit_prior: true,
    class_prior: null,
  },
  categorical_nb: {
    alpha: 1.0,
    force_alpha: true,
    fit_prior: true,
    class_prior: null,
    min_categories: null,
  },
  complement_nb: {
    alpha: 1.0,
    force_alpha: true,
    fit_prior: true,
    class_prior: null,
    norm: false,
  },
  gaussian_nb: {
    priors: null,
    var_smoothing: 1e-9,
  },
  multinomial_nb: {
    alpha: 1.0,
    force_alpha: true,
    fit_prior: true,
    class_prior: null,
  },
};
