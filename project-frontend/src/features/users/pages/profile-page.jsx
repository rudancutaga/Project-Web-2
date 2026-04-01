import ProfileCard from "@/features/auth/components/profile-card";

export default function ProfilePage({ onNavigate }) {
  return <ProfileCard onLoggedOut={() => onNavigate("/")} />;
}
