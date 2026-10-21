import { useState, useEffect, useCallback } from "react";
import {
  getUsersApi,
  createUserApi,
  deleteUserApi,
  getPharmacyGroupsApi,
  createPharmacyGroupApi,
} from "./api";

export interface UserItem {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  role: "admin" | "group_manager" | "pharmacy_user" | "client" | string;
  groupId?: string | null;
  pharmacyId?: string | null;
  mustChangePassword: boolean;
  createdAt?: string;
  group?: { id: string; name: string } | null;
  pharmacy?: { id: string; name: string } | null;
}

export interface PharmacyGroupItem {
  id: string;
  name: string;
  cnpj?: string | null;
  responsible?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string;
  pharmacies?: { id: string; name: string; cnpj: string }[];
}

export function useUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getUsersApi();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const addUser = async (data: {
    name: string;
    email: string;
    username?: string;
    role: string;
    groupId?: string | null;
    pharmacyId?: string | null;
  }) => {
    const res = await createUserApi(data);
    await refreshUsers();
    return res;
  };

  const removeUser = async (id: number) => {
    await deleteUserApi(id);
    await refreshUsers();
  };

  return {
    users,
    isLoading,
    refreshUsers,
    addUser,
    removeUser,
  };
}

export function usePharmacyGroups() {
  const [groups, setGroups] = useState<PharmacyGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPharmacyGroupsApi();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar grupos de farmácias:", err);
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  const addGroup = async (data: {
    name: string;
    cnpj?: string;
    responsible?: string;
    phone?: string;
    email?: string;
  }) => {
    const res = await createPharmacyGroupApi(data);
    await refreshGroups();
    return res;
  };

  return {
    groups,
    isLoading,
    refreshGroups,
    addGroup,
  };
}
