// Fictional development accounts for local/demo use only.
// Use fictional passwords here only; this file is part of the repository.
module.exports = {
    students: [
        {
            name:'a',
            email:'a@gmail.com',
            rollNo:'1',
            year:2,
            section:'A',
            branch:'CSE',
            hostel:'LH',
            cr:true,
            clubs: ['Robotics Club'],
            password: 'a',
        },
        {
            name:'b',
            email:'b@gmail.com',
            rollNo:'2',
            year:2,
            section:'A',
            branch:'ECE',
            hostel:'LH',
            clubs:['Dance and Dramatics Club'],
            gensec: 'Dance and Dramatics Club',
            password: 'b',
        },
    ],
    staff: [
        {
            name: 'staff1',
            email: 'staff1@gmail.com',
            staffId: 's1',
            designation: 'Faculty',
            hostel: 'Blocks',
            password: 'staff1',
        },
    ],
    shopkeepers: [
        {
            name: 'shopkeeper1',
            email: 'shopkeeper@gmail.com',
            password: 's',
            shop: {
                shopName: 'Demo Campus Store',
                location: 'Student Centre',
                timings: '9:00 AM - 8:00 PM',
                description: 'Fictional shop created by the development seed script.',
                isOpen: true,
            },
        },
    ],
};
