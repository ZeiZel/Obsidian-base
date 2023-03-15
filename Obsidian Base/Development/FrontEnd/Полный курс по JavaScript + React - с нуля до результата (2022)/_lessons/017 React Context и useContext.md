
`React.Context` и `useContext` - это функциональность, которая позволит создать один глобальный провайдер пропсов, чтобы пользоваться ими из любого участка приложения. То есть мы можем передавать данные по дереву компонентов не используя пропсы

Вот пример антипаттерна передачи пропсов через несколько промежуточных компонентов:

```JSX
<Page user={user} avatarSize={avatarSize} />
// ... который рендерит ...
<PageLayout user={user} avatarSize={avatarSize} />
// ... который рендерит ...
<NavigationBar user={user} avatarSize={avatarSize} />
// ... который рендерит ...
<Link href={user.permalink}>
  <Avatar user={user} size={avatarSize} />
</Link>
```






