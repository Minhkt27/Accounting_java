import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  ShieldAlert,
  BookOpen,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  SquarePlus,
  SquareMinus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

interface AccountCategory {
  id: string;
  name: string;
  type: string;
  status: string;
  parentId?: string;
  englishName?: string;
  description?: string;
  level?: number;
  hasChildren?: boolean;
}

function useCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return { username: "?", roles: [] as string[] };
    const data = JSON.parse(raw);
    return {
      username: data.username || "?",
      roles: (data.roles || []) as string[],
    };
  } catch {
    return { username: "?", roles: [] as string[] };
  }
}

export default function AccountCategoryPage() {
  const [accounts, setAccounts] = useState<AccountCategory[]>([]);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [type, setType] = useState("Dư Nợ");
  const [parentId, setParentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // New state for expand/collapse
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [pageSize, setPageSize] = useState(50);

  const { roles } = useCurrentUser();
  const isApprover =
    roles.includes("ROLE_ADMIN") || roles.includes("ROLE_KE_TOAN_TRUONG");

  const fetchAccounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/config/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rawAccounts = res.data as AccountCategory[];

      // Build hierarchy logic
      const processed = rawAccounts.map((acc) => {
        // Find if this account is a parent to others
        const hasChildren = rawAccounts.some(
          (other) =>
            other.parentId === acc.id ||
            (other.id.startsWith(acc.id) && other.id !== acc.id),
        );

        // Determine level (based on code length for standard VN accounts)
        let level = 0;
        if (acc.id.length > 3) {
          level = acc.id.length - 3;
        }

        return {
          ...acc,
          level,
          hasChildren,
        };
      });

      // Sort: parents then their children
      const sorted = [...processed].sort((a, b) => a.id.localeCompare(b.id));

      setAccounts(sorted);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        window.location.href = "/login";
      }
      const message = err instanceof Error ? err.message : String(err);
      setError("Không thể lấy dữ liệu: " + message);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const toggleExpand = (accountId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  // Filter accounts to show only root or those whose parents are expanded
  const visibleAccounts = accounts.filter((acc) => {
    if (searchTerm) return true; // Show all when searching

    if (acc.level === 0) return true;

    // Check if all ancestor parents are expanded
    // For simplicity, check the immediate parent
    const parentCode = acc.parentId || acc.id.substring(0, acc.id.length - 1);
    // Check if parentCode exists in accounts and if it is expanded
    return expandedIds.has(parentCode);
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const accountType =
        type === "Dư Nợ" ? "DEBIT" : type === "Dư Có" ? "CREDIT" : "BOTH";

      const payload = {
        id,
        name,
        englishName,
        type: accountType,
        parentId: parentId || null,
      };

      if (isEditing) {
        await axios.put(`/api/config/accounts/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/config/accounts", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchAccounts();
      cancelEdit();
      setShowForm(false);
      setError("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError("Lỗi lưu dữ liệu: " + message);
    }
  };

  const handleEdit = (acc: AccountCategory) => {
    setId(acc.id);
    setName(acc.name);
    setEnglishName(acc.englishName || "");
    setType(
      acc.type === "DEBIT"
        ? "Dư Nợ"
        : acc.type === "CREDIT"
          ? "Dư Có"
          : "Lưỡng tính",
    );
    setParentId(acc.parentId || "");
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (accountId: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${accountId}?`))
      return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/config/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAccounts();
    } catch {
      setError(
        "Không thể xóa tài khoản. Lưu ý: Tài khoản đã phát sinh giao dịch sẽ không thể xóa.",
      );
    }
  };

  const cancelEdit = () => {
    setId("");
    setName("");
    setEnglishName("");
    setType("Dư Nợ");
    setParentId("");
    setIsEditing(false);
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.id.includes(searchTerm) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatType = (t: string) => {
    if (t === "DEBIT") return "Dư Nợ";
    if (t === "CREDIT") return "Dư Có";
    if (t === "BOTH") return "Lưỡng tính";
    return t;
  };

  return (
    <div className="space-y-4 bg-gray-50 min-h-screen p-4">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <BookOpen className="w-6 h-6 text-blue-600" /> Hệ thống Tài khoản
        </h1>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên TK..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg w-64 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition-all"
            />
          </div>
          <Button
            onClick={() => {
              cancelEdit();
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {showForm ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {showForm ? "Đóng" : "Thêm tài khoản"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {isEditing ? "Cập nhật tài khoản" : "Thêm tài khoản mới"}
              </h3>
              <form
                onSubmit={handleSave}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Mã số tài khoản
                  </label>
                  <Input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="Ví dụ: 334"
                    required
                    disabled={isEditing}
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Tên tài khoản
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên tài khoản tiếng Việt"
                    required
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Tên tiếng Anh
                  </label>
                  <Input
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                    placeholder="English Name"
                    className="h-11 rounded-lg border-gray-300 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Tính chất
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option>Dư Nợ</option>
                    <option>Dư Có</option>
                    <option>Lưỡng tính</option>
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                    Tài khoản cha
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">-- Không có --</option>
                    {accounts
                      .filter(
                        (a) =>
                          (a.id !== id && a.id.length < id.length) ||
                          a.id.length <= 3,
                      )
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.id} - {a.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="md:col-span-6 flex justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                  >
                    {isEditing ? "Cập nhật" : "Lưu dữ liệu"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {/* ==============================================
              KHU VỰC VẼ BẢNG: DANH MỤC TÀI KHOẢN KẾ TOÁN (HIỆN THỊ DẠNG CÂY/TREE)
              ============================================== */}
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#E6F4F1] border-b border-gray-300">
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 w-40">
                  Số tài khoản
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300">
                  Tên tài khoản
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 w-32">
                  Tính chất
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300">
                  Tên tiếng Anh
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300">
                  Diễn giải
                </th>
                <th className="px-4 py-3 font-bold text-black border-r border-gray-300 w-32">
                  Trạng thái
                </th>
                <th className="px-4 py-3 font-bold text-black text-center w-28">
                  Chức năng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-20 text-gray-400 italic bg-white"
                  >
                    Không có dữ liệu nào phù hợp với tìm kiếm
                  </td>
                </tr>
              ) : (
                visibleAccounts.map((acc, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[#FFF8E1] transition-colors group ${acc.hasChildren ? "bg-gray-50/50" : ""}`}
                  >
                    <td
                      className="px-4 py-2.5 border-r border-gray-200 font-medium text-gray-700 flex items-center gap-2"
                      style={{ paddingLeft: `${(acc.level || 0) * 20 + 16}px` }}
                    >
                      {acc.hasChildren ? (
                        <button
                          onClick={() => toggleExpand(acc.id)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                        >
                          {expandedIds.has(acc.id) ? (
                            <SquareMinus
                              size={14}
                              className="text-blue-600 fill-blue-50"
                            />
                          ) : (
                            <SquarePlus
                              size={14}
                              className="text-blue-600 fill-blue-50"
                            />
                          )}
                        </button>
                      ) : (
                        <div className="w-[22px]" />
                      )}
                      <span
                        className={
                          acc.hasChildren ? "font-bold text-blue-800" : ""
                        }
                      >
                        {acc.id}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2.5 border-r border-gray-200 text-gray-900 ${acc.hasChildren ? "font-bold" : "font-medium"}`}
                    >
                      {acc.name}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-700 text-xs">
                      {formatType(acc.type)}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-500 italic text-xs">
                      {acc.englishName}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200 text-gray-500 text-xs">
                      {acc.description || ""}
                    </td>
                    <td className="px-4 py-2.5 border-r border-gray-200">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          acc.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {acc.status === "APPROVED"
                          ? "Đang sử dụng"
                          : "Chờ duyệt"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 group/actions relative">
                        <button
                          onClick={() => handleEdit(acc)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs font-medium"
                        >
                          Sửa <ChevronDown size={14} />
                        </button>
                        <div className="hidden group-hover/actions:flex absolute right-0 top-full bg-white shadow-lg border border-gray-200 rounded-md py-1 z-50 flex-col min-w-[80px]">
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="px-3 py-1.5 text-[11px] text-red-600 hover:bg-red-50 flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Xóa
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Professional Footer matching the screenshot */}
        <div className="bg-white border-t border-gray-300 p-3 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 gap-4">
          <div className="font-medium">
            Tổng số:{" "}
            <span className="font-bold text-black">
              {filteredAccounts.length}
            </span>{" "}
            bản ghi
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
              >
                <option value={10}>10 bản ghi trên 1 trang</option>
                <option value={20}>20 bản ghi trên 1 trang</option>
                <option value={50}>50 bản ghi trên 1 trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button className="px-2 py-1 hover:bg-gray-100 rounded text-gray-400">
                Trước
              </button>
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  className={`w-7 h-7 flex items-center justify-center rounded border ${
                    p === 1
                      ? "border-blue-600 bg-blue-50 text-blue-600 font-bold"
                      : "border-transparent hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button className="px-2 py-1 hover:bg-gray-100 rounded text-blue-600 font-medium">
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
