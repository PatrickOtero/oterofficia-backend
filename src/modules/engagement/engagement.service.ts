import { inject, injectable } from "tsyringe";
import { AppError } from "../../core/errors/AppError";
import { TOKENS } from "../../shared/container/tokens";
import { AuthenticatedSessionUser } from "../auth/auth.types";
import { StudyComment } from "../comments/comment.types";
import { StudyReference } from "../studies/study.repository.interface";
import { IEngagementRepository } from "./engagement.repository.interface";

@injectable()
export class EngagementService {
  constructor(
    @inject(TOKENS.EngagementRepository)
    private readonly repository: IEngagementRepository
  ) {}

  public async getAdminInteractionAnalytics() {
    return this.repository.getAdminInteractionAnalytics();
  }

  public async listNotifications(recipientUserId: string, limit?: number) {
    return this.repository.listNotificationFeed(recipientUserId, limit);
  }

  public async markAllNotificationsRead(recipientUserId: string) {
    await this.repository.markAllNotificationsRead(recipientUserId);
    return this.repository.listNotificationFeed(recipientUserId);
  }

  public async markNotificationRead(notificationId: string, recipientUserId: string) {
    const wasUpdated = await this.repository.markNotificationRead(notificationId, recipientUserId);

    if (!wasUpdated) {
      throw new AppError("Notificacao nao encontrada.", 404, "notification_not_found");
    }

    return this.repository.listNotificationFeed(recipientUserId);
  }

  public async registerStudyLike(actor: AuthenticatedSessionUser, study: StudyReference) {
    await this.repository.createInteractionEvent({
      actorUserId: actor.id,
      kind: "study_like",
      metadata: {
        postSlug: study.slug,
        postTitle: study.title,
      },
      studyPostId: study.id,
    });

    const adminRecipients = await this.repository.listAdminRecipients(actor.id);

    await this.repository.createNotifications(
      adminRecipients.map((recipient) => ({
        actorUserId: actor.id,
        body: `${actor.name} curtiu a publicacao "${study.title}".`,
        kind: "admin-study-like",
        metadata: {
          actorRole: actor.role,
          postId: study.id,
          postSlug: study.slug,
          postTitle: study.title,
        },
        recipientUserId: recipient.id,
        targetPath: `/studies/${study.slug}`,
        title: "Nova curtida em publicacao",
      }))
    );
  }

  public async registerStudyView(actorUserId: string, study: StudyReference) {
    const alreadyTracked = await this.repository.findRecentInteraction({
      actorUserId,
      kind: "study_view",
      since: new Date(Date.now() - 1000 * 60 * 60 * 6),
      studyPostId: study.id,
    });

    if (alreadyTracked) {
      return;
    }

    await this.repository.createInteractionEvent({
      actorUserId,
      kind: "study_view",
      metadata: {
        postSlug: study.slug,
        postTitle: study.title,
      },
      studyPostId: study.id,
    });
  }

  public async registerCommentCreated(input: {
    actor: AuthenticatedSessionUser;
    comment: StudyComment;
    parentCommentOwnerId?: string | null;
    study: StudyReference;
  }) {
    const { actor, comment, parentCommentOwnerId, study } = input;

    await this.repository.createInteractionEvent({
      actorUserId: actor.id,
      commentId: comment.id,
      kind: parentCommentOwnerId ? "comment_reply" : "comment_created",
      metadata: {
        postSlug: study.slug,
        postTitle: study.title,
      },
      studyPostId: study.id,
    });

    const notifications = [];
    const excludedParticipantIds = new Set<string>([actor.id]);

    if (parentCommentOwnerId) {
      const replyRecipient = await this.repository.findRecipientById(parentCommentOwnerId);

      if (replyRecipient) {
        excludedParticipantIds.add(replyRecipient.id);

        if (replyRecipient.id !== actor.id && replyRecipient.role === "user") {
          notifications.push({
            actorUserId: actor.id,
            body: `${actor.name} respondeu um comentario seu em "${study.title}".`,
            kind: "comment-reply" as const,
            metadata: {
              actorRole: actor.role,
              commentId: comment.id,
              postId: study.id,
              postSlug: study.slug,
              postTitle: study.title,
            },
            recipientUserId: replyRecipient.id,
            targetPath: `/studies/${study.slug}`,
            title: "Responderam seu comentario",
          });
        }
      }
    }

    const threadRecipients = await this.repository.listPostParticipantRecipients(study.id, [...excludedParticipantIds]);

    notifications.push(
      ...threadRecipients
        .filter((recipient) => recipient.role === "user")
        .map((recipient) => ({
          actorUserId: actor.id,
          body: `${actor.name} comentou na mesma publicacao que voce: "${study.title}".`,
          kind: "thread-comment" as const,
          metadata: {
            actorRole: actor.role,
            commentId: comment.id,
            postId: study.id,
            postSlug: study.slug,
            postTitle: study.title,
          },
          recipientUserId: recipient.id,
          targetPath: `/studies/${study.slug}`,
          title: "Nova conversa na publicacao",
        }))
    );

    const adminRecipients = await this.repository.listAdminRecipients(actor.id);

    notifications.push(
      ...adminRecipients.map((recipient) => ({
        actorUserId: actor.id,
        body: parentCommentOwnerId
          ? `${actor.name} respondeu um comentario em "${study.title}".`
          : `${actor.name} comentou em "${study.title}".`,
        kind: parentCommentOwnerId ? ("admin-reply" as const) : ("admin-comment" as const),
        metadata: {
          actorRole: actor.role,
          commentId: comment.id,
          postId: study.id,
          postSlug: study.slug,
          postTitle: study.title,
        },
        recipientUserId: recipient.id,
        targetPath: `/studies/${study.slug}`,
        title: parentCommentOwnerId ? "Nova resposta em comentario" : "Novo comentario em publicacao",
      }))
    );

    await this.repository.createNotifications(notifications);
  }

  public async registerCommentLike(input: {
    actor: AuthenticatedSessionUser;
    commentId: string;
    commentOwnerUserId: string;
    study: StudyReference;
  }) {
    const { actor, commentId, commentOwnerUserId, study } = input;

    await this.repository.createInteractionEvent({
      actorUserId: actor.id,
      commentId,
      kind: "comment_like",
      metadata: {
        postSlug: study.slug,
        postTitle: study.title,
      },
      studyPostId: study.id,
    });

    const notifications = [];
    const directRecipient = await this.repository.findRecipientById(commentOwnerUserId);

    if (directRecipient && directRecipient.id !== actor.id && directRecipient.role === "user") {
      notifications.push({
        actorUserId: actor.id,
        body: `${actor.name} curtiu um comentario seu em "${study.title}".`,
        kind: "comment-like" as const,
        metadata: {
          actorRole: actor.role,
          commentId,
          postId: study.id,
          postSlug: study.slug,
          postTitle: study.title,
        },
        recipientUserId: directRecipient.id,
        targetPath: `/studies/${study.slug}`,
        title: "Curtiram seu comentario",
      });
    }

    const adminRecipients = await this.repository.listAdminRecipients(actor.id);

    notifications.push(
      ...adminRecipients.map((recipient) => ({
        actorUserId: actor.id,
        body: `${actor.name} curtiu um comentario em "${study.title}".`,
        kind: "admin-comment-like" as const,
        metadata: {
          actorRole: actor.role,
          commentId,
          postId: study.id,
          postSlug: study.slug,
          postTitle: study.title,
        },
        recipientUserId: recipient.id,
        targetPath: `/studies/${study.slug}`,
        title: "Nova curtida em comentario",
      }))
    );

    await this.repository.createNotifications(notifications);
  }
}
