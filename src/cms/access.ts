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
