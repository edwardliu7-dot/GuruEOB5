import { createContext, useContext, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogin, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import type { Teacher } from "@workspace/api-client-react";

type AuthContextType = {
  user: Teacher | undefined;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  logout: ReturnType<typeof useLogout>["mutateAsync"];
  isLoggingIn: boolean;
  isLoggingOut: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe({
    query: { retry: false, queryKey: getGetMeQueryKey() },
  });
  const loginMutation = useLogin({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
    },
  });
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
