const prisma = require("../config/prisma");
class FriendshipService {
    // create gắn thẻ cho user
    static async assignTag(userId, tagId) {
        return prisma.user.update({
        where:{id: userId},
        data: {
            tags: {
            connect: { id: tagId } // 'connect': Đây là lệnh thần thánh của Prisma cho quan hệ nhiều-nhiều.
                    // Nó tự động tạo một dòng trong bảng trung gian (_TagToUser) để nối User và Tag.
                    
            }
        },
        include: { tags: true } //trả về luôn thẻ đã được gán
        });
    }
    //delete
    static async removeTag(userId,tagId){
        return prisma.user.update({
            where:{id:userId},
            data:{
                tags:{
                    disconnect:{id:tagId} // 'disconnect': Lệnh này sẽ xóa dòng trong bảng trung gian nối User và Tag.
                }
            },
            include:{tags:true} //trả về luôn thẻ đã bị gỡ
        });
    }
    //create tạo tag mới
    static async createTag(data){
        return prisma.tag.create({
            data:data
        });
    }
    //getall lấy tất cả
    static async getAll(){
        return prisma.tag.findMany();
    }
}
module.exports = FriendshipService;