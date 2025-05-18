declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.json" {
  const content: any;
  export default content;
}

declare const process: {
  env: {
    API_BASE_URL?: string;
    API_KEY?: string;
    NODE_ENV: "development" | "production" | "test";
  };
}; 