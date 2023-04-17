import { Model, Table, Unique, Column, DefaultScope, DataType } from 'sequelize-typescript';

export enum PermissionsNames {
  client = 'client',
  manager = 'manager',
  admin = 'admin',

  infoHobbieAdd = 'infoHobbieAdd',
  infoHobbieEdit = 'infoHobbieEdit',
  infoHobbieDelete = 'infoHobbieDelete',
  infoSupportTitleAdd = 'infoSupportTitleAdd',
  infoSupportTitleEdit = 'infoSupportTitleEdit',
  infoSupportTitleDelete = 'infoSupportTitleDelete',

  mediaPhotoDelete = 'mediaPhotoDelete',

  supportGet = 'supportGet',
  supportEdit = 'supportEdit',

  managerGet = 'managerGet',
  managerRequestGet = 'managerRequestGet',
  managerRequestEdit = 'managerRequestEdit',
  adminGet = 'adminGet',
  userGet = 'userGet',
  userAdd = 'userAdd',
  userBlockUnblock = 'userBlockUnblock',
  userDelete = 'userDelete',
  userRestore = 'userRestore',
  userPhotosGet = 'userPhotosGet',

  permissionsGet = 'permissionsGet',
  permissionsEdit = 'permissionsEdit',

  eventsGet = 'eventsGet',
  eventEdit = 'eventEdit',
  eventDelete = 'eventDelete',
  eventCancel = 'eventCancel',
  eventChangeOwner = 'eventChangeOwner',
  eventPublishUnpublish = 'eventPublishUnpublish',
  eventMembersGet = 'eventMembersGet',
  eventMembersBlockUnblock = 'eventMembersBlockUnblock',
  eventMembersRequest = 'eventMembersRequest',
  eventPhotosGet = 'eventPhotosGet',
  eventPhotosAdd = 'eventPhotosAdd',
  eventCommentsGet = 'eventCommentsGet',
  eventCommentsDelete = 'eventCommentsDelete',
  eventReviewsGet = 'eventReviewsGet',
  eventReviewsAdd = 'eventReviewsAdd',
}

export const PermissionsDescription = {
  client: 'Доступ к приложению',
  manager: 'Доступ к личному кабинету',
  admin: 'Доступ к панели администратора',

  infoHobbieAdd: 'Добавление увлечений',
  infoHobbieEdit: 'Редактирование увлечений',
  infoHobbieDelete: 'Удаление увлечений',
  infoSupportTitleAdd: 'Добавление тем обращений',
  infoSupportTitleEdit: 'Редактирование тем обращений',
  infoSupportTitleDelete: 'Удаление тем обращений',

  mediaPhotoDelete: 'Удаление фото',

  supportGet: 'Получение обращений в поддержку',
  supportEdit: 'Редактирование статусов обращений в поддержку',

  managerGet: 'Получение организаций',
  managerRequestGet: 'Получение заявок на регистрацию организаций',
  managerRequestEdit: 'Редактирование заявок на регистрацию организаций',
  adminGet: 'Получение администраторов',
  userGet: 'Получение пользователей',
  userAdd: 'Добавление пользователя',
  userBlockUnblock: 'Заблокировать/Разблокировать пользователя',
  userDelete: 'Удаление пользователя',
  userRestore: 'Восстановление аккаунта',
  userPhotosGet: 'Просмотр всех фото пользователя',

  permissionsGet: 'Просмотр разрешений',
  permissionsEdit: 'Редактирование разрешений',

  eventsGet: 'Получение всех событий',
  eventEdit: 'Редактирование события',
  eventDelete: 'Удаление события',
  eventCancel: 'Отмена события',
  eventChangeOwner: 'Смена владельца события',
  eventPublishUnpublish: 'Публикация/Снятие с публикации события',
  eventMembersGet: 'Получение всех пользователей события',
  eventMembersBlockUnblock: 'Заблокировать/Разблокировать участника события',
  eventMembersRequest: 'Принятие/Отмена заявки в закрытое событие',
  eventPhotosGet: 'Получение всех фото события',
  eventPhotosAdd: 'Добавление фото в событие',
  eventCommentsGet: 'Получение всех комментариев события',
  eventCommentsDelete: 'Удаление комментариев события',
  eventReviewsGet: 'Получение отзывов события',
  eventReviewsAdd: 'Добавление отзыва события',
};

@DefaultScope(() => ({
  attributes: {
    exclude: ['createdAt', 'updatedAt'],
  },
}))
@Table
export class Permission extends Model<Permission> {
  @Unique
  @Column(DataType.ENUM(...Object.values(PermissionsNames)))
  name: string;

  @Column(DataType.TEXT)
  description: string;
}
