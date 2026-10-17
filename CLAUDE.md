# phongtro

Repo: https://github.com/HienPhuong99/phongtro (remote `origin`, nhánh chính `main`)

## Quy tắc làm việc

Mỗi khi xong 1 task, tự động làm (không cần hỏi lại):

1. **Commit** — làm trên nhánh `task/<tên-ngắn>`, commit theo Conventional Commits.
2. **Merge** — `git checkout main && git merge --no-ff task/<tên-ngắn>`, rồi `git push origin main` và xoá nhánh task.
3. **Triển khai** — chạy lệnh deploy của dự án (ghi vào mục bên dưới khi đã có). Chưa có thì bỏ qua và báo lại.

Nếu build/test lỗi thì dừng lại, không merge/deploy, báo lỗi.

## Deploy

Chưa cấu hình.
