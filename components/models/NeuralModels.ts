export const neuralModels = {
  multilayer_perceptron: {
    layers: [],                  // Array of { units, activation } objects
    learning_rate: 0.01,         // Initial learning rate for optimization
    regularization: 0.1,         // L2 regularization strength (alpha)
    optimizer: "adam",           // Optimization algorithm
    batch_size: 32,              // Number of samples per gradient update
    epochs: 100,                 // Number of training epochs
    activation: "relu",          // Default activation for hidden layers (overridden by layers)
    loss: "mse",                 // Loss function (mean squared error default)
    dropout_rate: 0.0,           // Dropout rate (0.0 means no dropout)
    momentum: 0.9,               // Momentum for optimizers like SGD
    early_stopping: false,       // Whether to use early stopping
    validation_split: 0.2,       // Fraction of data for validation
  },
  convolutional_neural_network: {
    layers: [],                  // Array of { units, activation, filters, kernel_size, pool_size } objects
    learning_rate: 0.01,         // Initial learning rate
    regularization: 0.1,         // L2 regularization strength
    optimizer: "adam",           // Optimization algorithm
    batch_size: 32,              // Number of samples per gradient update
    epochs: 100,                 // Number of training epochs
    loss: "mse",                 // Loss function
    dropout_rate: 0.0,           // Dropout rate
    momentum: 0.9,               // Momentum for optimizers
    filters: 32,                 // Default number of filters in conv layers
    kernel_size: 3,              // Default kernel size for conv layers
    pool_size: 2,                // Default pooling size
    padding: "valid",            // Padding type ("valid" or "same")
    strides: 1,                  // Stride length for convolution
    early_stopping: false,       // Whether to use early stopping
    validation_split: 0.2,       // Fraction of data for validation
  },
  recurrent_neural_network: {
    layers: [],                  // Array of { units, activation, return_sequences } objects
    learning_rate: 0.01,         // Initial learning rate
    regularization: 0.1,         // L2 regularization strength
    optimizer: "adam",           // Optimization algorithm
    batch_size: 32,              // Number of samples per gradient update
    epochs: 100,                 // Number of training epochs
    loss: "mse",                 // Loss function
    dropout_rate: 0.0,           // Dropout rate
    momentum: 0.9,               // Momentum for optimizers
    rnn_type: "lstm",            // Type of RNN cell ("lstm", "gru", "simple")
    return_sequences: false,     // Whether to return sequences or last output
    bidirectional: false,        // Whether to use bidirectional RNN
    early_stopping: false,       // Whether to use early stopping
    validation_split: 0.2,       // Fraction of data for validation
  },
};