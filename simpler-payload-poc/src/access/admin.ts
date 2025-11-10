export const admin = ({ req: { user } }) => {
  return user?.role === 'admin'
}
