import type { Access, FieldAccess } from 'payload';
import { Role } from './consts';

export const anyone: Access = () => true;

export const isSignedIn: Access = ({ req: { user } }) => Boolean(user);

export const isAdmin: Access = ({ req: { user } }) => user?.role === Role.Admin;

export const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === Role.Admin;

/** Редактор видит и правит только свою учетную запись, администратор — все. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  return user.role === Role.Admin || { id: { equals: user.id } };
};

/** Черновик виден только в админке: без входа отдаются одни опубликованные записи. */
export const publishedOrSignedIn: Access = ({ req: { user } }) => Boolean(user) || { _status: { equals: 'published' } };

/** Контент сайта читают все, а правят вошедшие в админку — и администратор, и редактор. */
export const CONTENT_ACCESS = { read: anyone, create: isSignedIn, update: isSignedIn, delete: isSignedIn };

/** Отзывы: администратор видит все, остальные — только опубликованные; приглашения и полученные скрыты. */
export const isAdminOrPublished: Access = ({ req: { user } }) =>
  user?.role === Role.Admin || { status: { equals: 'published' } };

/**
 * Ссылку автора без входа и под редактором видно, только когда автор явно разрешил ее публиковать (`noLink: false`);
 * пустая отметка — ссылка закрыта. Это правило и закрывает утечку: при проверке запроса документа нет → искать,
 * считать, сортировать по ссылке и `findDistinct('link')` может только администратор, а `select` без отметки ссылку
 * не отдает. `forceSelect` коллекции подмешивает отметку в узкий `select`, чтобы разрешенная ссылка не пропадала.
 */
export const isAdminOrLinkAllowed: FieldAccess = ({ req: { user }, doc }) =>
  user?.role === Role.Admin || doc?.restrictions?.noLink === false;

/** Перевод без входа видно, только когда автор его подтвердил; администратор видит всегда. */
export const isAdminOrTranslationApproved: FieldAccess = ({ req: { user }, siblingData }) =>
  user?.role === Role.Admin || siblingData?.approved === true;
