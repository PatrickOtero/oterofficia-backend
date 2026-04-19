const apiUrl = process.env.PUBLIC_API_URL || "http://localhost:3002";

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Oterofficia API",
    version: "1.0.0",
    description:
      "API oficial do Oterofficia para autenticacao, estudos, projetos, uploads, contato e operacoes administrativas.",
    contact: {
      name: "Oterofficia",
      url: "https://oterofficia.com",
    },
  },
  servers: [
    {
      url: apiUrl,
      description: "Servidor atual da API",
    },
  ],
  tags: [
    { name: "Auth", description: "Cadastro, login, perfil, confirmacoes por e-mail e sessao do usuario." },
    { name: "Studies", description: "Consultas publicas de estudos e leitura individual." },
    { name: "Study Interactions", description: "Curtidas e comentarios nos estudos publicados." },
    { name: "Admin Studies", description: "Gerenciamento administrativo do acervo de estudos." },
    { name: "Projects", description: "Listagem publica e administracao dos projetos do portfolio." },
    { name: "Uploads", description: "Upload administrativo e entrega publica de arquivos." },
    { name: "Contact", description: "Canal de contato do site." },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          code: { type: "string", example: "validation_error" },
          details: { nullable: true },
          message: { type: "string", example: "Nao foi possivel concluir a solicitacao." },
        },
      },
      MessageResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operacao concluida com sucesso." },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", example: "43ce2e4e-9105-4a17-8ed1-72bf1d9496b2" },
          name: { type: "string", example: "Patrick Otero" },
          email: { type: "string", format: "email", example: "patrick@oterofficia.com" },
          role: { type: "string", enum: ["user", "admin"], example: "user" },
          avatarUrl: { type: "string", nullable: true, example: `${apiUrl}/uploads/avatars/avatar.png` },
          birthDate: { type: "string", nullable: true, example: "1998-12-03" },
          emailVerifiedAt: { type: "string", nullable: true, format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "raw-session-token" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Conta criada. Verifique o seu e-mail para confirmar o cadastro.",
          },
          requiresEmailVerification: {
            type: "boolean",
            example: true,
          },
        },
      },
      ProfileResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      ProfileMutationResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Perfil atualizado com sucesso." },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      StudyBlockInput: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["heading", "paragraph", "image", "code", "quote", "list", "divider", "callout", "references"],
            example: "paragraph",
          },
          data: {
            type: "object",
            description: "Conteudo do bloco conforme o tipo informado.",
            additionalProperties: true,
            example: {
              text: "Conteudo principal do bloco.",
            },
          },
        },
        required: ["type", "data"],
      },
      StudyBlock: {
        allOf: [
          { $ref: "#/components/schemas/StudyBlockInput" },
          {
            type: "object",
            properties: {
              id: { type: "string", example: "f7dbba83-ae6f-4f59-bfe7-95275fa4108d" },
              position: { type: "integer", example: 1 },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      StudySummary: {
        type: "object",
        properties: {
          id: { type: "string", example: "study-uuid" },
          title: { type: "string", example: "O que e uma inteligencia deterministica" },
          slug: { type: "string", example: "o-que-e-uma-inteligencia-deterministica" },
          excerpt: { type: "string", example: "Resumo da publicacao." },
          coverImage: { type: "string", nullable: true, example: `${apiUrl}/uploads/study-covers/capa.png` },
          status: { type: "string", enum: ["draft", "published"], example: "published" },
          category: { type: "string", example: "Engenharia de software" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["arquitetura", "sistemas deterministas"],
          },
          readingTime: { type: "integer", example: 4 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          publishedAt: { type: "string", nullable: true, format: "date-time" },
          seoTitle: { type: "string", nullable: true },
          seoDescription: { type: "string", nullable: true },
          likesCount: { type: "integer", example: 2 },
          commentsCount: { type: "integer", example: 3 },
          likedByCurrentUser: { type: "boolean", example: false },
        },
      },
      StudyDetail: {
        allOf: [
          { $ref: "#/components/schemas/StudySummary" },
          {
            type: "object",
            properties: {
              content: {
                type: "array",
                items: { $ref: "#/components/schemas/StudyBlock" },
              },
            },
          },
        ],
      },
      StudyListResponse: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: {
              categories: { type: "array", items: { type: "string" } },
              tags: { type: "array", items: { type: "string" } },
            },
          },
          posts: {
            type: "array",
            items: { $ref: "#/components/schemas/StudySummary" },
          },
        },
      },
      StudyDashboardData: {
        type: "object",
        properties: {
          metrics: {
            type: "object",
            properties: {
              totalPosts: { type: "integer", example: 18 },
              totalPublishedPosts: { type: "integer", example: 12 },
              totalDraftPosts: { type: "integer", example: 6 },
              totalLikes: { type: "integer", example: 147 },
              totalComments: { type: "integer", example: 25 },
            },
          },
          recentComments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                content: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                authorName: { type: "string" },
                postId: { type: "string" },
                postTitle: { type: "string" },
              },
            },
          },
          recentPosts: {
            type: "array",
            items: { $ref: "#/components/schemas/StudySummary" },
          },
        },
      },
      StudyComment: {
        type: "object",
        properties: {
          id: { type: "string", example: "comment-uuid" },
          content: { type: "string", example: "Excelente leitura." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          postId: { type: "string", example: "study-uuid" },
          canDelete: { type: "boolean", example: true },
          author: {
            type: "object",
            properties: {
              id: { type: "string", example: "user-uuid" },
              name: { type: "string", example: "Patrick Otero" },
            },
          },
          postTitle: { type: "string", nullable: true, example: "Fluxo logico" },
        },
      },
      CreateCommentResponse: {
        type: "object",
        properties: {
          comment: { $ref: "#/components/schemas/StudyComment" },
          commentsCount: { type: "integer", example: 7 },
        },
      },
      LikeResponse: {
        type: "object",
        properties: {
          postId: { type: "string", example: "study-uuid" },
          likesCount: { type: "integer", example: 5 },
          likedByCurrentUser: { type: "boolean", example: true },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          project_name: { type: "string", example: "Pairing Forge" },
          project_desc: { type: "string", example: "Descricao do projeto." },
          image_url: { type: "string", example: `${apiUrl}/uploads/projects/pairing-forge.png` },
          frontend_url: { type: "string", nullable: true, example: "https://app.oterofficia.com" },
          backend_url: { type: "string", nullable: true, example: "https://api.oterofficia.com" },
          video_url: { type: "string", nullable: true, example: "https://youtu.be/demo" },
        },
      },
      ProjectInput: {
        type: "object",
        properties: {
          project_name: { type: "string", example: "Pairing Forge" },
          project_desc: { type: "string", example: "Descricao do projeto." },
          image_url: { type: "string", example: `${apiUrl}/uploads/projects/pairing-forge.png` },
          frontend_url: { type: "string", nullable: true, example: "https://app.oterofficia.com" },
          backend_url: { type: "string", nullable: true, example: "https://api.oterofficia.com" },
          video_url: { type: "string", nullable: true, example: "https://youtu.be/demo" },
        },
        required: ["project_name", "project_desc", "image_url"],
      },
      UploadAssetResponse: {
        type: "object",
        properties: {
          key: { type: "string", example: "study-covers/capa-01.png" },
          url: { type: "string", example: `${apiUrl}/uploads/study-covers/capa-01.png` },
          folder: { type: "string", enum: ["avatars", "projects", "study-content", "study-covers"] },
          fileName: { type: "string", example: "capa-01.png" },
          mimeType: { type: "string", example: "image/png" },
          size: { type: "integer", example: 248113 },
          source: { type: "string", enum: ["cloudflare", "local"], example: "cloudflare" },
          fallbackUsed: { type: "boolean", example: false },
        },
      },
      ContactInput: {
        type: "object",
        properties: {
          name: { type: "string", example: "Patrick" },
          email: { type: "string", format: "email", example: "patrick@email.com" },
          subject: { type: "string", example: "Nova oportunidade" },
          emailContent: { type: "string", example: "Mensagem enviada pelo formulario do site." },
        },
        required: ["name", "email", "subject", "emailContent"],
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Criar conta",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Conta criada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" },
              },
            },
          },
          "409": {
            description: "E-mail ja utilizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Fazer login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Sessao criada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Credenciais invalidas.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Reenviar confirmacao de e-mail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Processado com sucesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["Auth"],
        summary: "Confirmar e-mail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                },
                required: ["token"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "E-mail confirmado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Solicitar redefinicao de senha",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Instrucao disparada quando aplicavel.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Redefinir senha",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  password: { type: "string", minLength: 8 },
                },
                required: ["token", "password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Senha atualizada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/confirm-email-change": {
      post: {
        tags: ["Auth"],
        summary: "Confirmar troca de e-mail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                },
                required: ["token"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "E-mail atualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/confirm-account-deletion": {
      post: {
        tags: ["Auth"],
        summary: "Confirmar exclusao de conta",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                },
                required: ["token"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Conta excluida.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Buscar perfil autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Perfil atual.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProfileResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Encerrar sessao atual",
        security: [{ bearerAuth: [] }],
        responses: {
          "204": {
            description: "Sessao encerrada.",
          },
        },
      },
    },
    "/auth/profile": {
      patch: {
        tags: ["Auth"],
        summary: "Atualizar perfil",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  birthDate: { type: "string", nullable: true, example: "1998-12-03" },
                  avatarUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Perfil atualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProfileMutationResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/profile/password": {
      patch: {
        tags: ["Auth"],
        summary: "Alterar senha autenticada",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  currentPassword: { type: "string", minLength: 8 },
                  newPassword: { type: "string", minLength: 8 },
                },
                required: ["currentPassword", "newPassword"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Senha atualizada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/profile/avatar": {
      post: {
        tags: ["Auth"],
        summary: "Enviar avatar",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Avatar atualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProfileMutationResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/profile/email-change": {
      post: {
        tags: ["Auth"],
        summary: "Solicitar troca de e-mail",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nextEmail: { type: "string", format: "email" },
                },
                required: ["nextEmail"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Solicitacao processada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/profile/account-deletion": {
      post: {
        tags: ["Auth"],
        summary: "Solicitar exclusao de conta",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  password: { type: "string", minLength: 8 },
                },
                required: ["password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Solicitacao processada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/studies": {
      get: {
        tags: ["Studies"],
        summary: "Listar estudos publicados",
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "tag", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Lista de estudos publicados.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyListResponse" },
              },
            },
          },
        },
      },
    },
    "/studies/{slug}": {
      get: {
        tags: ["Studies"],
        summary: "Buscar estudo publicado por slug",
        parameters: [
          {
            in: "path",
            name: "slug",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Detalhe completo da publicacao.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyDetail" },
              },
            },
          },
        },
      },
    },
    "/studies/{studyId}/comments": {
      get: {
        tags: ["Study Interactions"],
        summary: "Listar comentarios de um estudo",
        parameters: [
          {
            in: "path",
            name: "studyId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Comentarios da publicacao.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudyComment" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Study Interactions"],
        summary: "Criar comentario em estudo",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "studyId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  content: { type: "string", maxLength: 2000 },
                },
                required: ["content"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Comentario publicado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCommentResponse" },
              },
            },
          },
        },
      },
    },
    "/studies/{studyId}/likes": {
      post: {
        tags: ["Study Interactions"],
        summary: "Curtir estudo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "studyId", required: true, schema: { type: "string" } },
        ],
        responses: {
          "201": {
            description: "Curtida registrada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LikeResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Study Interactions"],
        summary: "Remover curtida do estudo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "studyId", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Curtida removida.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LikeResponse" },
              },
            },
          },
        },
      },
    },
    "/comments/{commentId}": {
      delete: {
        tags: ["Study Interactions"],
        summary: "Remover comentario proprio",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "commentId", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Comentario removido.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    commentsCount: { type: "integer", example: 6 },
                    postId: { type: "string", example: "study-uuid" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/projects": {
      get: {
        tags: ["Projects"],
        summary: "Listar projetos publicos",
        responses: {
          "200": {
            description: "Lista de projetos.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Project" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Criar projeto",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProjectInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Projeto criado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
        },
      },
    },
    "/projects/{projectId}": {
      get: {
        tags: ["Projects"],
        summary: "Buscar projeto por id",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "projectId", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Projeto encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Projects"],
        summary: "Atualizar projeto",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "projectId", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProjectInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Projeto atualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Excluir projeto",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "projectId", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Projeto removido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/receiveEmail": {
      post: {
        tags: ["Contact"],
        summary: "Enviar mensagem de contato",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ContactInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Mensagem enviada.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/uploads/{folder}/{fileName}": {
      get: {
        tags: ["Uploads"],
        summary: "Buscar arquivo publico",
        parameters: [
          {
            in: "path",
            name: "folder",
            required: true,
            schema: { type: "string", enum: ["avatars", "projects", "study-content", "study-covers"] },
          },
          {
            in: "path",
            name: "fileName",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Arquivo binario.",
            content: {
              "image/*": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
        },
      },
    },
    "/admin/uploads": {
      post: {
        tags: ["Uploads"],
        summary: "Enviar arquivo administrativo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  folder: {
                    type: "string",
                    enum: ["avatars", "projects", "study-content", "study-covers"],
                  },
                  file: {
                    type: "string",
                    format: "binary",
                  },
                },
                required: ["folder", "file"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Arquivo enviado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadAssetResponse" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Uploads"],
        summary: "Remover arquivo administrativo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  key: { type: "string", example: "projects/demo.png" },
                },
                required: ["key"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Arquivo removido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" },
              },
            },
          },
        },
      },
    },
    "/admin/studies/dashboard": {
      get: {
        tags: ["Admin Studies"],
        summary: "Painel administrativo de estudos",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Metricas e atividade recente.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyDashboardData" },
              },
            },
          },
        },
      },
    },
    "/admin/studies": {
      get: {
        tags: ["Admin Studies"],
        summary: "Listar estudos no painel",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "tag", schema: { type: "string" } },
          { in: "query", name: "status", schema: { type: "string", enum: ["all", "draft", "published"] } },
        ],
        responses: {
          "200": {
            description: "Estudos no painel.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudySummary" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Admin Studies"],
        summary: "Criar estudo",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slug: { type: "string", nullable: true },
                  excerpt: { type: "string" },
                  coverImage: { type: "string", nullable: true },
                  status: { type: "string", enum: ["draft", "published"] },
                  category: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  seoTitle: { type: "string", nullable: true },
                  seoDescription: { type: "string", nullable: true },
                  readingTime: { type: "integer", nullable: true },
                  content: {
                    type: "array",
                    items: { $ref: "#/components/schemas/StudyBlockInput" },
                  },
                },
                required: ["title", "excerpt", "status", "category", "tags", "content"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Estudo criado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyDetail" },
              },
            },
          },
        },
      },
    },
    "/admin/studies/comments": {
      get: {
        tags: ["Admin Studies"],
        summary: "Listar comentarios no painel",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "postId", schema: { type: "string" } },
          { in: "query", name: "search", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Comentarios encontrados.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StudyComment" },
                },
              },
            },
          },
        },
      },
    },
    "/admin/studies/comments/{commentId}": {
      delete: {
        tags: ["Admin Studies"],
        summary: "Excluir comentario pelo painel",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "commentId", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Comentario removido.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    commentsCount: { type: "integer" },
                    postId: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/studies/{id}": {
      get: {
        tags: ["Admin Studies"],
        summary: "Buscar estudo no painel",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Estudo encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyDetail" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Admin Studies"],
        summary: "Atualizar estudo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slug: { type: "string", nullable: true },
                  excerpt: { type: "string" },
                  coverImage: { type: "string", nullable: true },
                  status: { type: "string", enum: ["draft", "published"] },
                  category: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  seoTitle: { type: "string", nullable: true },
                  seoDescription: { type: "string", nullable: true },
                  readingTime: { type: "integer", nullable: true },
                  content: {
                    type: "array",
                    items: { $ref: "#/components/schemas/StudyBlockInput" },
                  },
                },
                required: ["title", "excerpt", "status", "category", "tags", "content"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Estudo atualizado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyDetail" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Admin Studies"],
        summary: "Excluir estudo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          "204": {
            description: "Estudo removido.",
          },
        },
      },
    },
    "/admin/studies/{id}/status": {
      patch: {
        tags: ["Admin Studies"],
        summary: "Alterar status do estudo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["draft", "published"] },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Status alterado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StudyDetail" },
              },
            },
          },
        },
      },
    },
  },
} as const;
