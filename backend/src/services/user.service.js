const prisma = require("../config/prisma");

class UserService {
    static create(data) {
        return prisma.user.create({data});
    }

    static getAll() {
        return prisma.user.findMany({
            where: {deletedAt : null}, 
            orderBy: {createdAt: "desc"},
        });
    }

    static getById() {
        return prisma.user.findUnique({ where: { id: Number(id) } });
    }

    static getByUserName() {
        return prisma.user.findUnique({
            where: {username},
        });
    }

    static update(id, data) {
        return prisma.user.update({
            where: {id}, data,
        });
    }

    static softDelete(id) {
        return prisma.user.update({
            where: {id}, 
            data: {deletedAt: new Date()},
        });
    }

    static hartDelete(id) {
        return prisma.user.delete({
            where: {id},
        });
    }
}

module.exports = UserService;
