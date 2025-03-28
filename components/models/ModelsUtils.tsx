import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { neuralModels } from "./NeuralModels";

interface LayerConfig {
  units: number;
  activation: string;
  filters?: number;
  kernel_size?: number;
  pool_size?: number;
  return_sequences?: boolean;
}

interface ModelConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
}

interface DatasetInfo {
  datasetId: string;
  columns: string[];
  shape: [number, number];
  columnTypes: Record<string, string>;
  targetColumn?: string;
  summary: {
    missingValues: Record<string, number>;
    uniqueValues: Record<string, number>;
  };
}

export const renderHyperparameters = (
  model: ModelConfig,
  handleHyperparameterChange: (modelType: string, param: string, value: any) => void,
  handleAddLayer: (modelType: string) => void,
  handleLayerChange: (
    modelType: string,
    index: number,
    field: keyof LayerConfig,
    value: number | string | boolean
  ) => void,
  isNeural: boolean
) => {
  const { modelType, hyperparameters } = model;
  
  return (
    <div className="p-4 border rounded-lg mt-2">
      <h4 className="font-medium mb-2">{modelType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</h4>
      <div className="grid gap-4">
        {Object.entries(hyperparameters).map(([param, value]) => {
          // Neural-specific layer handling
          if (param === "layers" && isNeural) {
            return (
              <div key={param}>
                <Button onClick={() => handleAddLayer(modelType)} className="mb-2">Add Layer</Button>
              </div>
            )
          }

          // Neural network model-level hyperparameters
          if (param === "learning_rate" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Learning Rate</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.001}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "regularization" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Regularization</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "optimizer" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Optimizer</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select optimizer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adam">Adam</SelectItem>
                    <SelectItem value="sgd">SGD</SelectItem>
                    <SelectItem value="rmsprop">RMSprop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "batch_size" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Batch Size</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                  placeholder="Batch Size"
                />
              </div>
            );
          }
          if (param === "epochs" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Epochs</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                  placeholder="Epochs"
                />
              </div>
            );
          }
          if (param === "activation" && modelType === "multilayer_perceptron") {
            return (
              <div key={param}>
                <label className="block mb-2">Default Activation</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Activation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relu">ReLU</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                    <SelectItem value="tanh">Tanh</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "loss" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Loss Function</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loss" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mse">Mean Squared Error</SelectItem>
                    <SelectItem value="mae">Mean Absolute Error</SelectItem>
                    <SelectItem value="categorical_crossentropy">Categorical Crossentropy</SelectItem>
                    <SelectItem value="binary_crossentropy">Binary Crossentropy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "dropout_rate" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Dropout Rate</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "momentum" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Momentum</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "filters" && modelType === "convolutional_neural_network") {
            return (
              <div key={param}>
                <label className="block mb-2">Default Filters</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                  placeholder="Filters"
                />
              </div>
            );
          }
          if (param === "kernel_size" && modelType === "convolutional_neural_network") {
            return (
              <div key={param}>
                <label className="block mb-2">Default Kernel Size</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                  placeholder="Kernel Size"
                />
              </div>
            );
          }
          if (param === "pool_size" && modelType === "convolutional_neural_network") {
            return (
              <div key={param}>
                <label className="block mb-2">Default Pool Size</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                  placeholder="Pool Size"
                />
              </div>
            );
          }
          if (param === "padding" && modelType === "convolutional_neural_network") {
            return (
              <div key={param}>
                <label className="block mb-2">Padding</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select padding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="same">Same</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "strides" && modelType === "convolutional_neural_network") {
            return (
              <div key={param}>
                <label className="block mb-2">Strides</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                  placeholder="Strides"
                />
              </div>
            );
          }
          if (param === "rnn_type" && modelType === "recurrent_neural_network") {
            return (
              <div key={param}>
                <label className="block mb-2">RNN Type</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RNN type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lstm">LSTM</SelectItem>
                    <SelectItem value="gru">GRU</SelectItem>
                    <SelectItem value="simple">Simple RNN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "return_sequences" && modelType === "recurrent_neural_network") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Return Sequences (Default)</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "bidirectional" && modelType === "recurrent_neural_network") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Bidirectional</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "early_stopping" && isNeural) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Early Stopping</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "validation_split" && isNeural) {
            return (
              <div key={param}>
                <label className="block mb-2">Validation Split</label>
                <Slider
                  defaultValue={[value]}
                  max={0.5}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }

          // Regression-specific hyperparameters
          if (param === "n_estimators" && modelType === "adaboost_regressor") {
            return (
              <div key={param}>
                <label className="block mb-2">Number of Estimators</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "learning_rate" && modelType === "adaboost_regressor") {
            return (
              <div key={param}>
                <label className="block mb-2">Learning Rate</label>
                <Slider
                  defaultValue={[value]}
                  max={10}
                  step={0.1}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "loss" && modelType === "adaboost_regressor") {
            return (
              <div key={param}>
                <label className="block mb-2">Loss</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loss" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="exponential">Exponential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "alpha" && ["elastic_net", "lasso", "ridge"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Alpha</label>
                <Slider
                  defaultValue={[value]}
                  max={10}
                  step={0.1}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "l1_ratio" && modelType === "elastic_net") {
            return (
              <div key={param}>
                <label className="block mb-2">L1 Ratio</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "fit_intercept" && ["elastic_net", "lasso", "linear_regression", "ridge"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Fit Intercept</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "precompute" && ["elastic_net", "lasso"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Precompute</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "copy_X" && ["elastic_net", "lasso", "linear_regression", "ridge"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Copy X</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "max_iter" && ["elastic_net", "lasso", "ridge", "svr"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Max Iterations</label>
                <Input
                  type="number"
                  value={value === null || value === -1 ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? (modelType === "svr" ? -1 : null) : Number(e.target.value))}
                  min={1}
                  placeholder={modelType === "svr" ? "-1 for no limit" : "None or value"}
                />
              </div>
            );
          }
          if (param === "positive" && ["elastic_net", "lasso", "linear_regression", "ridge", "svr"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Positive</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "selection" && ["elastic_net", "lasso"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Selection</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select selection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cyclic">Cyclic</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "solver" && modelType === "ridge") {
            return (
              <div key={param}>
                <label className="block mb-2">Solver</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select solver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="svd">SVD</SelectItem>
                    <SelectItem value="cholesky">Cholesky</SelectItem>
                    <SelectItem value="lsqr">LSQR</SelectItem>
                    <SelectItem value="sag">SAG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "kernel" && modelType === "svr") {
            return (
              <div key={param}>
                <label className="block mb-2">Kernel</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select kernel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rbf">RBF</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="poly">Polynomial</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "degree" && modelType === "svr") {
            return (
              <div key={param}>
                <label className="block mb-2">Degree</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "gamma" && modelType === "svr") {
            return (
              <div key={param}>
                <label className="block mb-2">Gamma</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gamma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">Scale</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "coef0" && modelType === "svr") {
            return (
              <div key={param}>
                <label className="block mb-2">Coef0</label>
                <Slider
                  defaultValue={[value]}
                  max={10}
                  step={0.1}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "epsilon" && modelType === "svr") {
            return (
              <div key={param}>
                <label className="block mb-2">Epsilon</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "shrinking" && modelType === "svr") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Shrinking</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "cache_size" && modelType === "svr") {
            return (
              <div key={param}>
                <label className="block mb-2">Cache Size</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }

          // Naive Bayes-specific hyperparameters
          if (param === "alpha" && ["bernoulli_nb", "categorical_nb", "complement_nb", "multinomial_nb"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Alpha</label>
                <Slider
                  defaultValue={[value]}
                  max={10}
                  step={0.1}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "force_alpha" && ["bernoulli_nb", "categorical_nb", "complement_nb", "multinomial_nb"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Force Alpha</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "binarize" && modelType === "bernoulli_nb") {
            return (
              <div key={param}>
                <label className="block mb-2">Binarize</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "fit_prior" && ["bernoulli_nb", "categorical_nb", "complement_nb", "multinomial_nb"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Fit Prior</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "class_prior" && ["bernoulli_nb", "categorical_nb", "complement_nb", "multinomial_nb"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Class Prior</label>
                <Input
                  type="text"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : e.target.value)}
                  placeholder="None or comma-separated values"
                />
              </div>
            );
          }
          if (param === "min_categories" && modelType === "categorical_nb") {
            return (
              <div key={param}>
                <label className="block mb-2">Min Categories</label>
                <Input
                  type="number"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : Number(e.target.value))}
                  min={1}
                  placeholder="None or value"
                />
              </div>
            );
          }
          if (param === "norm" && modelType === "complement_nb") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Normalize</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "priors" && modelType === "gaussian_nb") {
            return (
              <div key={param}>
                <label className="block mb-2">Priors</label>
                <Input
                  type="text"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : e.target.value)}
                  placeholder="None or comma-separated values"
                />
              </div>
            );
          }
          if (param === "var_smoothing" && modelType === "gaussian_nb") {
            return (
              <div key={param}>
                <label className="block mb-2">Variance Smoothing</label>
                <Slider
                  defaultValue={[value]}
                  max={1e-8}
                  step={1e-10}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }

          // Clustering-specific hyperparameters
          if (param === "n_clusters" && ["agglomerative_clustering", "birch_clustering", "k_means_clustering", "mini_batch_kmeans", "spectral_clustering"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Number of Clusters</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "metric" && ["agglomerative_clustering", "dbscan"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Metric</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="euclidean">Euclidean</SelectItem>
                    <SelectItem value="manhattan">Manhattan</SelectItem>
                    <SelectItem value="cosine">Cosine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "compute_full_tree" && modelType === "agglomerative_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Compute Full Tree</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compute full tree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "linkage" && modelType === "agglomerative_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Linkage</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select linkage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ward">Ward</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "distance_threshold" && modelType === "agglomerative_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Distance Threshold</label>
                <Input
                  type="number"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : Number(e.target.value))}
                  step={0.1}
                  placeholder="None or value"
                />
              </div>
            );
          }
          if (param === "compute_distances" && modelType === "agglomerative_clustering") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Compute Distances</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "threshold" && modelType === "birch_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Threshold</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "branching_factor" && modelType === "birch_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Branching Factor</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "compute_labels" && ["birch_clustering", "mini_batch_kmeans"].includes(modelType)) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Compute Labels</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "copy" && modelType === "birch_clustering") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Copy</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "eps" && modelType === "dbscan") {
            return (
              <div key={param}>
                <label className="block mb-2">Epsilon (eps)</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "min_samples" && modelType === "dbscan") {
            return (
              <div key={param}>
                <label className="block mb-2">Min Samples</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "init" && ["k_means_clustering", "mini_batch_kmeans"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Initialization</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select init" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="k-means++">K-Means++</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "n_init" && ["k_means_clustering", "mini_batch_kmeans", "spectral_clustering"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Number of Initializations</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val === "auto" ? "auto" : Number(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select n_init" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "copy_x" && modelType === "k_means_clustering") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Copy X</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "algorithm" && modelType === "k_means_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Algorithm</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lloyd">Lloyd</SelectItem>
                    <SelectItem value="elkan">Elkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "bandwidth" && modelType === "mean_shift_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Bandwidth</label>
                <Input
                  type="number"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : Number(e.target.value))}
                  step={0.1}
                  placeholder="None or value"
                />
              </div>
            );
          }
          if (param === "bin_seeding" && modelType === "mean_shift_clustering") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Bin Seeding</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "min_bin_freq" && modelType === "mean_shift_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Min Bin Frequency</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "cluster_all" && modelType === "mean_shift_clustering") {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">Cluster All</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }
          if (param === "batch_size" && modelType === "mini_batch_kmeans") {
            return (
              <div key={param}>
                <label className="block mb-2">Batch Size</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "max_no_improvement" && modelType === "mini_batch_kmeans") {
            return (
              <div key={param}>
                <label className="block mb-2">Max No Improvement</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "init_size" && modelType === "mini_batch_kmeans") {
            return (
              <div key={param}>
                <label className="block mb-2">Init Size</label>
                <Input
                  type="number"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : Number(e.target.value))}
                  min={1}
                  placeholder="None or value"
                />
              </div>
            );
          }
          if (param === "reassignment_ratio" && modelType === "mini_batch_kmeans") {
            return (
              <div key={param}>
                <label className="block mb-2">Reassignment Ratio</label>
                <Slider
                  defaultValue={[value]}
                  max={1}
                  step={0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "eigen_solver" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Eigen Solver</label>
                <Select
                  value={value === null ? "none" : value}
                  onValueChange={(val) => handleHyperparameterChange(modelType, param, val === "none" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select eigen solver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="arpack">ARPACK</SelectItem>
                    <SelectItem value="lobpcg">LOBPCG</SelectItem>
                    <SelectItem value="amg">AMG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "n_components" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Number of Components</label>
                <Input
                  type="number"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : Number(e.target.value))}
                  min={1}
                  placeholder="None or value"
                />
              </div>
            );
          }
          if (param === "gamma" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Gamma</label>
                <Slider
                  defaultValue={[value]}
                  max={10}
                  step={0.1}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }
          if (param === "affinity" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Affinity</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select affinity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rbf">RBF</SelectItem>
                    <SelectItem value="nearest_neighbors">Nearest Neighbors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "n_neighbors" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Number of Neighbors</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "eigen_tol" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Eigen Tolerance</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val === "auto" ? "auto" : Number(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select eigen tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="0.0">0.0</SelectItem>
                    <SelectItem value="0.0001">0.0001</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "assign_labels" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Assign Labels</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assign labels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kmeans">K-Means</SelectItem>
                    <SelectItem value="discretize">Discretize</SelectItem>
                    <SelectItem value="cluster_qr">Cluster QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "degree" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Degree</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={1}
                />
              </div>
            );
          }
          if (param === "coef0" && modelType === "spectral_clustering") {
            return (
              <div key={param}>
                <label className="block mb-2">Coef0</label>
                <Slider
                  defaultValue={[value]}
                  max={10}
                  step={0.1}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }

          // Common classification-specific hyperparameters
          if (param === "criterion") {
            return (
              <div key={param}>
                <label className="block mb-2">Criterion</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select criterion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gini">Gini</SelectItem>
                    <SelectItem value="entropy">Entropy</SelectItem>
                    {modelType === "gradient_boosting_classifier" && <SelectItem value="friedman_mse">Friedman MSE</SelectItem>}
                    {modelType === "decision_tree_classifier" && <SelectItem value="log_loss">Log Loss</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "splitter" && modelType === "decision_tree_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Splitter</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select splitter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best">Best</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "max_features") {
            return (
              <div key={param}>
                <label className="block mb-2">Max Features</label>
                <Select
                  value={value === null ? "none" : value}
                  onValueChange={(val) => handleHyperparameterChange(modelType, param, val === "none" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select max features" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="sqrt">Sqrt</SelectItem>
                    <SelectItem value="log2">Log2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "class_weight") {
            return (
              <div key={param}>
                <label className="block mb-2">Class Weight</label>
                <Select
                  value={value === null ? "none" : value}
                  onValueChange={(val) => handleHyperparameterChange(modelType, param, val === "none" ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "weights" && modelType === "k_nearest_neighbors_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Weights</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uniform">Uniform</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "algorithm" && !["k_means_clustering"].includes(modelType)) {
            return (
              <div key={param}>
                <label className="block mb-2">Algorithm</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelType === "ada_boost_classifier" ? (
                      <>
                        <SelectItem value="SAMME">SAMME</SelectItem>
                        <SelectItem value="SAMME.R">SAMME.R</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="ball_tree">Ball Tree</SelectItem>
                        <SelectItem value="kd_tree">KD Tree</SelectItem>
                        <SelectItem value="brute">Brute</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "kernel" && modelType === "support_vector_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Kernel</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select kernel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rbf">RBF</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="poly">Polynomial</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "penalty" && modelType === "logistic_regression") {
            return (
              <div key={param}>
                <label className="block mb-2">Penalty</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select penalty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="l1">L1</SelectItem>
                    <SelectItem value="l2">L2</SelectItem>
                    <SelectItem value="elasticnet">Elastic Net</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "solver" && modelType === "logistic_regression") {
            return (
              <div key={param}>
                <label className="block mb-2">Solver</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select solver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liblinear">Liblinear</SelectItem>
                    <SelectItem value="lbfgs">LBFGS</SelectItem>
                    <SelectItem value="newton-cg">Newton-CG</SelectItem>
                    <SelectItem value="sag">SAG</SelectItem>
                    <SelectItem value="saga">SAGA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "multi_class" && modelType === "logistic_regression") {
            return (
              <div key={param}>
                <label className="block mb-2">Multi Class</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select multi class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="ovr">OVR</SelectItem>
                    <SelectItem value="multinomial">Multinomial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "loss" && modelType === "gradient_boosting_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Loss</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loss" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="log_loss">Log Loss</SelectItem>
                    <SelectItem value="exponential">Exponential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "gamma" && modelType === "support_vector_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Gamma</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gamma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">Scale</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "metric" && modelType === "k_nearest_neighbors_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Metric</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minkowski">Minkowski</SelectItem>
                    <SelectItem value="euclidean">Euclidean</SelectItem>
                    <SelectItem value="manhattan">Manhattan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (param === "decision_function_shape" && modelType === "support_vector_classifier") {
            return (
              <div key={param}>
                <label className="block mb-2">Decision Function Shape</label>
                <Select value={value} onValueChange={(val) => handleHyperparameterChange(modelType, param, val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ovr">OVR</SelectItem>
                    <SelectItem value="ovo">OVO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // Common numeric inputs
          if (
            ["max_depth", "max_leaf_nodes", "random_state", "n_estimators", "n_jobs", "max_iter", "verbose", "n_iter_no_change", "max_samples"].includes(param) &&
            (value === null || typeof value === "number")
          ) {
            return (
              <div key={param}>
                <label className="block mb-2">{param.replace("_", " ")}</label>
                <Input
                  type="number"
                  value={value === null ? "" : value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, e.target.value === "" ? null : Number(e.target.value))}
                  min={param === "max_depth" || param === "max_leaf_nodes" || param === "n_estimators" ? 1 : 0}
                  placeholder="None or value"
                />
              </div>
            );
          }
          if (
            ["min_samples_split", "min_samples_leaf", "leaf_size", "p"].includes(param) &&
            typeof value === "number"
          ) {
            return (
              <div key={param}>
                <label className="block mb-2">{param.replace("_", " ")}</label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => handleHyperparameterChange(modelType, param, Number(e.target.value))}
                  min={param === "min_samples_split" ? 2 : 1}
                  step={0.1}
                />
              </div>
            );
          }

          // Common float sliders
          if (
            [
              "learning_rate",
              "min_weight_fraction_leaf",
              "min_impurity_decrease",
              "ccp_alpha",
              "subsample",
              "tol",
              "C",
            ].includes(param) &&
            typeof value === "number"
          ) {
            return (
              <div key={param}>
                <label className="block mb-2">{param.replace("_", " ")}</label>
                <Slider
                  defaultValue={[value]}
                  max={param === "C" ? 10 : 1}
                  step={param === "tol" ? 0.0001 : 0.01}
                  onValueChange={([val]) => handleHyperparameterChange(modelType, param, val)}
                />
                <span className="text-sm text-muted-foreground mt-1">Current: {value}</span>
              </div>
            );
          }

          // Common boolean switches
          if (
            ["dual", "fit_intercept", "shrinking", "probability", "verbose", "warm_start", "bootstrap", "oob_score", "break_ties"].includes(param) &&
            typeof value === "boolean"
          ) {
            return (
              <div key={param} className="flex items-center space-x-2">
                <label className="block">{param.replace("_", " ")}</label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleHyperparameterChange(modelType, param, checked)}
                />
              </div>
            );
          }

          return null; // Ignore unhandled params (e.g., memory, connectivity, metric_params)
        })}
      </div>
    </div>
  );
};

export const renderNetworkArchitecture = (
  model: ModelConfig, 
  datasetInfo: DatasetInfo | null,
  handleLayerChange: (
    modelType: string,
    index: number,
    field: keyof LayerConfig,
    value: number | string | boolean
  ) => void
) => {
  if (!Object.keys(neuralModels).includes(model.modelType)) return null;

  const layers = [
    {
      type: "Input",
      units: datasetInfo?.shape[1] || "N/A",
      color: "bg-blue-100 text-blue-900",
      activation: "",
      filters: null,
      kernel_size: null,
      pool_size: null,
      return_sequences: null,
      editable: false,
    },
    ...model.hyperparameters.layers.map((layer: LayerConfig, index: number) => ({
      type: `Hidden ${index + 1}`,
      units: layer.units,
      color: "bg-teal-100 text-teal-900",
      activation: layer.activation,
      filters: layer.filters || null,
      kernel_size: layer.kernel_size || null,
      pool_size: layer.pool_size || null,
      return_sequences: layer.return_sequences || null,
      editable: true,
    })),
    {
      type: "Output",
      units: 1,
      color: "bg-purple-100 text-purple-900",
      activation: "",
      filters: null,
      kernel_size: null,
      pool_size: null,
      return_sequences: null,
      editable: false,
    },
  ];

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">Network Architecture ({model.modelType})</h3>
      <div className="relative flex items-center h-auto flex-wrap gap-4">
        {layers.map((layer, index) => (
          <div
            key={index}
            className={`${layer.color} p-4 rounded-lg w-48 min-h-24`}
            style={{ position: "relative" }}
          >
            <h4 className="font-semibold">{layer.type}</h4>
            {layer.editable ? (
              <>
                <Input
                  type="number"
                  value={layer.units}
                  onChange={(e) => (model.modelType, index - 1, "units", Number(e.target.value))}
                  min={1}
                  placeholder="Units"
                  className="mb-2 mt-2 bg-white"
                />
                <Select
                  value={layer.activation}
                  onValueChange={(val) => handleLayerChange(model.modelType, index - 1, "activation", val)}
                >
                  <SelectTrigger className="mb-2 bg-white">
                    <SelectValue placeholder="Activation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relu">ReLU</SelectItem>
                    <SelectItem value="sigmoid">Sigmoid</SelectItem>
                    <SelectItem value="tanh">Tanh</SelectItem>
                    <SelectItem value="linear">Linear</SelectItem>
                  </SelectContent>
                </Select>
                {model.modelType === "convolutional_neural_network" && (
                  <>
                    <Input
                      type="number"
                      value={layer.filters || 32}
                      onChange={(e) => handleLayerChange(model.modelType, index - 1, "filters", Number(e.target.value))}
                      min={1}
                      placeholder="Filters"
                      className="mb-2 bg-white"
                    />
                    <Input
                      type="number"
                      value={layer.kernel_size || 3}
                      onChange={(e) =>
                        handleLayerChange(model.modelType, index - 1, "kernel_size", Number(e.target.value))
                      }
                      min={1}
                      placeholder="Kernel Size"
                      className="mb-2 bg-white"
                    />
                    <Input
                      type="number"
                      value={layer.pool_size || 2}
                      onChange={(e) => handleLayerChange(model.modelType, index - 1, "pool_size", Number(e.target.value))}
                      min={1}
                      placeholder="Pool Size"
                      className="mb-2 bg-white"
                    />
                  </>
                )}
                {model.modelType === "recurrent_neural_network" && (
                  <div className="flex items-center space-x-2 mt-2">
                    <label className="text-sm">Return Seq</label>
                    <Switch
                      checked={layer.return_sequences || false}
                      onCheckedChange={(checked) =>
                        handleLayerChange(model.modelType, index - 1, "return_sequences", checked)
                      }
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <p>Units: {layer.units}</p>
                {layer.activation && <p>Act: {layer.activation}</p>}
                {layer.filters && <p>Filters: {layer.filters}</p>}
                {layer.kernel_size && <p>Kernel: {layer.kernel_size}</p>}
                {layer.pool_size && <p>Pool: {layer.pool_size}</p>}
                {layer.return_sequences !== null && <p>Seq: {layer.return_sequences ? "Yes" : "No"}</p>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};