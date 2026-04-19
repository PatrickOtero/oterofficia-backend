export type ProjectInput = {
  backendUrl: string | null;
  frontendUrl: string | null;
  imageUrl: string;
  projectDescription: string;
  projectName: string;
  videoUrl: string | null;
};

export type ProjectResponse = {
  backend_url: string | null;
  frontend_url: string | null;
  id: number;
  image_url: string;
  project_desc: string;
  project_name: string;
  video_url: string | null;
};
